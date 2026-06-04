// VARIABLES COMPARTIDAS
let diasMuestreados = [1, 5, 10, 15, 20, 30];
let preciosArroz = [5, 5.8, 6.7, 7.5, 8.4, 10];
let mapaGraficos = {};

// Factoría de renderizado aislada
function actualizarGraficoUnico(id, config) {
    if (mapaGraficos[id]) {
        mapaGraficos[id].destroy();
    }
    const canvas = document.getElementById(id);
    if (canvas) {
        mapaGraficos[id] = new Chart(canvas, config);
    }
}

// MÓDULO 1: INTERPOLACIÓN LAGRANGE
function lagrange(x) {
    let n = diasMuestreados.length;
    let resultado = 0;
    for (let i = 0; i < n; i++) {
        let termino = preciosArroz[i];
        for (let j = 0; j < n; j++) {
            if (i != j) {
                termino *= (x - diasMuestreados[j]) / (diasMuestreados[i] - diasMuestreados[j]);
            }
        }
        resultado += termino;
    }
    return resultado;
}

function interpolar() {
    let x = parseFloat(document.getElementById("diaInterpolar").value);
    if (isNaN(x)) x = 12;
    let precio = lagrange(x);
    document.getElementById("resultadoInterpolacion").innerHTML = "Precio estimado = " + precio.toFixed(2) + " Bs";
    graficarInterpolacion();
}

function graficarInterpolacion() {
    let px = [], py = [];
    for (let i = 1; i <= 30; i++) { px.push(i); py.push(lagrange(i)); }
    
    actualizarGraficoUnico("graficoInterpolacion", {
        type: 'line',
        data: {
            labels: px,
            datasets: [{ label: 'Precio estimado P(x)', data: py, borderColor: '#0066cc', fill: false }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// MÓDULO 2: INTEGRACIÓN NUMÉRICA
function integrar() {
    let a = 1, b = 30, n = 100, h = (b - a) / n, suma = 0;
    for (let i = 1; i < n; i++) {
        let x = a + i * h;
        suma += 3 * (5 + 0.17 * x);
    }
    let resultado = (h / 2) * (3 * (5 + 0.17 * a) + 2 * suma + 3 * (5 + 0.17 * b));
    document.getElementById("resultadoIntegracion").innerHTML = "Gasto acumulado = " + resultado.toFixed(2) + " Bs";
    graficarIntegracion();
}

function graficarIntegracion() {
    let x = [], y = [];
    for (let i = 1; i <= 30; i++) { x.push(i); y.push(3 * (5 + 0.17 * i)); }
    
    actualizarGraficoUnico("graficoIntegracion", {
        type: 'bar',
        data: {
            labels: x,
            datasets: [{ label: 'Costo diario', data: y, backgroundColor: '#28a745' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// MÓDULO 3: RAÍCES (CORREGIDO)
function f(x) {
    let pres = parseFloat(document.getElementById("presupuestoInput")?.value || 650);
    return 15 * x + 0.255 * x * x - pres;
}
function df(x) { return 15 + 0.51 * x; }

function newton() {
    let x = 20, tabla = "";
    // SE CORRIGIÓ EL BUCLE INCOMPLETO DEL ARCHIVO ORIGINAL
    for (let i = 1; i <= 8; i++) {
        let xn = x - f(x) / df(x);
        tabla += "<tr><td>" + i + "</td><td>" + xn.toFixed(5) + "</td></tr>";
        x = xn;
    }
    document.getElementById("tablaNewton").innerHTML = tabla;
    document.getElementById("resultadoRaiz").innerHTML = "Día crítico = " + x.toFixed(2);
    graficarRaiz();
}

function graficarRaiz() {
    let x = [], y = [];
    for (let i = 0; i <= 35; i++) { x.push(i); y.push(f(i)); }
    actualizarGraficoUnico("graficoRaiz", {
        type: 'line',
        data: {
            labels: x,
            datasets: [{ label: 'Curva de Gasto Familiar', data: y, borderColor: '#dc3545', fill: false }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Inicialización de la primera tanda de módulos
window.addEventListener("DOMContentLoaded", () => {
    interpolar();
    integrar();
    newton();
});