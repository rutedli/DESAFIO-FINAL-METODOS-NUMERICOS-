// Memoria caché para registrar las instancias activas de los gráficos
let instanciasGraficos = {};

// Inicialización automática tras cargar la estructura del DOM
window.addEventListener("DOMContentLoaded", () => {
    calcularSistemas();
    ejecutarNewton();
    ejecutarInterpolacion();
    ejecutarIntegracion();
    ejecutarEDO();
});

/**
 * Destruye de forma segura gráficos existentes en un canvas antes de generar nuevos elementos.
 */
function actualizarLienzoGrafico(idCanvas, config) {
    if (instanciasGraficos[idCanvas]) {
        instanciasGraficos[idCanvas].destroy();
    }
    const lienzo = document.getElementById(idCanvas);
    if (lienzo) {
        instanciasGraficos[idCanvas] = new Chart(lienzo, config);
    }
}

// --- MÓDULO 1: SISTEMAS LINEALES (ESCENARIOS A Y F) ---
function calcularSistemas() {
    let n = parseFloat(document.getElementById("demandaNorte").value) || 300;
    let c = parseFloat(document.getElementById("demandaCentro").value) || 450;
    let s = parseFloat(document.getElementById("demandaSur").value) || 250;

    // Matriz simétrica bien condicionada A para la red operacional
    let mMatriz = [
        [4, 1, 0.5],
        [1, 5, 1],
        [0.5, 1, 3]
    ];

    function resolverGaussSeidel(b1, b2, b3) {
        let x = [0, 0, 0];
        for (let iter = 0; iter < 20; iter++) {
            x[0] = (b1 - mMatriz[0][1] * x[1] - mMatriz[0][2] * x[2]) / mMatriz[0][0];
            x[1] = (b2 - mMatriz[1][0] * x[0] - mMatriz[1][2] * x[2]) / mMatriz[1][1];
            x[2] = (b3 - mMatriz[2][0] * x[0] - mMatriz[2][1] * x[1]) / mMatriz[2][2];
        }
        return x;
    }

    let resA = resolverGaussSeidel(n, c, s);
    document.getElementById("txtSistemaA").innerHTML = 
        `Flujo de asignación base -> P1: ${resA[0].toFixed(2)} u | P2: ${resA[1].toFixed(2)} u | P3: ${resA[2].toFixed(2)} u.`;

    // Escenario F: Inyección de una perturbación por rumores de escasez (+5% de demanda)
    let resF = resolverGaussSeidel(n * 1.05, c * 1.05, s * 1.05);
    let desviacion = ((resF[0] - resA[0]) / resA[0]) * 100;

    document.getElementById("txtSistemaF").innerHTML = 
        `Flujo modificado por pánico -> P1: ${resF[0].toFixed(2)} u | P2: ${resF[1].toFixed(2)} u | P3: ${resF[2].toFixed(2)} u.<br>` +
        `<em>Sensibilidad evaluada:</em> Una fluctuación del 5% en la entrada generó una alteración exacta del <strong>${desviacion.toFixed(1)}%</strong> en la distribución final. El sistema es estable.`;

    actualizarLienzoGrafico("chartSistemas", {
        type: 'bar',
        data: {
            labels: ['Planta Norte', 'Planta Centro', 'Planta Sur'],
            datasets: [
                { label: 'Normal (Escenario A)', data: resA, backgroundColor: '#0f172a' },
                { label: 'Bajo Rumor (Escenario F)', data: resF, backgroundColor: '#ef4444' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- MÓDULO 2: RAÍCES (ESCENARIO E) ---
function ejecutarNewton() {
    let presupuesto = parseFloat(document.getElementById("presupuestoInput").value) || 650;
    
    function f(x) { return 15 * x + 0.255 * x * x - presupuesto; }
    function df(x) { return 15 + 0.51 * x; }

    let xCurrent = 20;
    let cuerpoTabla = "";
    
    for (let k = 1; k <= 5; k++) {
        let xNext = xCurrent - f(xCurrent) / df(xCurrent);
        cuerpoTabla += `<tr><td>${k}</td><td>${xNext.toFixed(5)}</td><td>${f(xNext).toFixed(5)}</td></tr>`;
        xCurrent = xNext;
    }

    document.getElementById("tablaNewtonBody").innerHTML = cuerpoTabla;
    document.getElementById("txtRaiz").innerHTML = `Intersección crítica localizada en el día: <strong>${xCurrent.toFixed(2)}</strong>`;
}

// --- MÓDULO 3: INTERPOLACIÓN (ESCENARIO C) ---
const xNodos = [1, 5, 10, 15, 20, 30];
const yNodos = [5, 5.8, 6.7, 7.5, 8.4, 10];

function interpolarLagrange(x) {
    let total = 0;
    let n = xNodos.length;
    for (let i = 0; i < n; i++) {
        let l_i = yNodos[i];
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                l_i *= (x - xNodos[j]) / (xNodos[i] - xNodos[j]);
            }
        }
        total += l_i;
    }
    return total;
}

function ejecutarInterpolacion() {
    let dia = parseFloat(document.getElementById("diaInterpolar").value);
    if (isNaN(dia)) dia = 12;

    let resVal = interpolarLagrange(dia);
    document.getElementById("txtInterpolacion").innerHTML = `Precio continuo mapeado para el día ${dia} = <strong>${resVal.toFixed(2)} Bs</strong>`;

    let dX = [], dY = [];
    for (let i = 1; i <= 30; i++) {
        dX.push(i);
        dY.push(interpolarLagrange(i));
    }

    actualizarLienzoGrafico("chartInterpolacion", {
        type: 'line',
        data: {
            labels: dX,
            datasets: [
                { label: 'Curva de Precios P(x)', data: dY, borderColor: '#0284c7', fill: false, tension: 0.1 },
                { label: 'Muestras Reales', data: xNodos.map((val, idx) => ({x: val, y: yNodos[idx]})), backgroundColor: '#0f172a', showLine: false, pointRadius: 5 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- MÓDULO 4: INTEGRACIÓN (ESCENARIO D) ---
function ejecutarIntegracion() {
    let limA = 1, limB = 30;
    let divisiones = 60;
    let anchoH = (limB - limA) / divisiones;

    function gastoDiario(t) { return 3 * (5 + 0.17 * t); }

    let sumatoria = 0;
    for (let i = 1; i < divisiones; i++) {
        sumatoria += gastoDiario(limA + i * anchoH);
    }

    // Cuadratura por Trapecio Compuesto
    let areaTotal = (anchoH / 2) * (gastoDiario(limA) + 2 * sumatoria + gastoDiario(limB));
    let costoEstableEstático = (limB - limA + 1) * gastoDiario(1);
    let perdidaAdquisitiva = areaTotal - costoEstableEstático;

    document.getElementById("txtIntegracion").innerHTML = 
        `Gasto financiero real acumulado: <strong>${areaTotal.toFixed(2)} Bs</strong>.<br>` +
        `Pérdida absoluta registrada en el poder adquisitivo familiar: <span style="color:#ef4444; font-weight:bold;">${perdidaAdquisitiva.toFixed(2)} Bs</span>.`;
}

// --- MÓDULO 5: ECUACIONES DIFERENCIALES ORDINARIAS (ESCENARIOS B Y G) ---
function ejecutarEDO() {
    let cParam = parseFloat(document.getElementById("parametroC").value);
    if (isNaN(cParam)) cParam = 0.05;

    let limiteT = 15, subSteps = 30;
    let hStep = limiteT / subSteps;

    let arrayT = [], arrayR = [], arrayM = [];
    
    // Inicialización de las variables de estado
    let R = 1000; // Reserva inicial de combustible
    let M = 15;   // Manifestantes iniciales

    for (let step = 0; step <= subSteps; step++) {
        let t = step * hStep;
        arrayT.push(t.toFixed(1));
        arrayR.push(R.toFixed(1));
        arrayM.push(M.toFixed(1));

        // --- Algoritmo RK4: Vaciado de Reservas (Escenario B) ---
        let dR_dt = (time) => 40 - (50 + 0.09 * time * time);
        let kr1 = dR_dt(t);
        let kr2 = dR_dt(t + 0.5 * hStep);
        let kr3 = dR_dt(t + 0.5 * hStep);
        let kr4 = dR_dt(t + hStep);
        R = Math.max(0, R + (hStep / 6) * (kr1 + 2 * kr2 + 2 * kr3 + kr4));

        // --- Algoritmo RK4: Cinética de Opinión (Escenario G) ---
        let dM_dt = (mVal) => 0.04 * mVal - cParam * mVal;
        let km1 = dM_dt(M);
        let km2 = dM_dt(M + 0.5 * hStep * km1);
        let km3 = dM_dt(M + 0.5 * hStep * km2);
        let km4 = dM_dt(M + hStep * km3);
        M = Math.max(0, M + (hStep / 6) * (km1 + 2 * km2 + 2 * km3 + km4));
    }

    // Gráfico Escenario B
    actualizarLienzoGrafico("chartReservas", {
        type: 'line',
        data: { labels: arrayT, datasets: [{ label: 'Reservas (Litros)', data: arrayR, borderColor: '#f97316', fill: false }] },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Gráfico Escenario G
    actualizarLienzoGrafico("chartSocial", {
        type: 'line',
        data: { labels: arrayT, datasets: [{ label: 'Manifestantes Activos', data: arrayM, borderColor: '#ef4444', fill: false }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}
