let mapaEdoGraficos = {};

function actualizarLienzoEdo(id, config) {
    if (mapaEdoGraficos[id]) {
        mapaEdoGraficos[id].destroy();
    }
    const canvas = document.getElementById(id);
    if (canvas) {
        mapaEdoGraficos[id] = new Chart(canvas, config);
    }
}

function ejecutarEDO() {
    let c = parseFloat(document.getElementById("parametroDialogo").value);
    if (isNaN(c)) c = 0.05;

    let t_max = 15, divisiones = 30, dt = t_max / divisiones;
    let ejeTiempo = [], histReservas = [], histNeutrales = [], histManifestantes = [], histMediadores = [];

    // Condiciones iniciales físicas estables
    let R = 1000;
    let N = 400, M = 15, D = 5;
    let a_inf = 0.0005, b_ret = 0.005, k_reac = 0.02, r_desg = 0.04;

    for (let i = 0; i <= divisiones; i++) {
        let t = i * dt;
        ejeTiempo.push(t.toFixed(1));
        histReservas.push(Number(R.toFixed(1)));
        histNeutrales.push(Number(N.toFixed(1)));
        histManifestantes.push(Number(M.toFixed(1)));
        histMediadores.push(Number(D.toFixed(1)));

        // Runge-Kutta 4: Reservas de combustible (Escenario B)
        let dR = (time) => 40 - (50 + 0.1 * time * time);
        let kr1 = dR(t), kr2 = dR(t + 0.5 * dt), kr3 = dR(t + 0.5 * dt), kr4 = dR(t + dt);
        R = Math.max(0, R + (dt / 6) * (kr1 + 2 * kr2 + 2 * kr3 + kr4));

        // Runge-Kutta 4: Dinámicas Colectivas Acopladas (Escenario G)
        let fN = (n, m, d) => -a_inf * n * m + b_ret * d;
        let fM = (n, m, d) => a_inf * n * m - c * m * d;
        let fD = (n, m, d) => k_reac * m - r_desg * d;

        let kn1 = fN(N, M, D),          km1 = fM(N, M, D),          kd1 = fD(N, M, D);
        let kn2 = fN(N + 0.5 * dt * kn1, M + 0.5 * dt * km1, D + 0.5 * dt * kd1);
        let km2 = fM(N + 0.5 * dt * kn1, M + 0.5 * dt * km1, D + 0.5 * dt * kd1);
        let kd2 = fD(N + 0.5 * dt * kn1, M + 0.5 * dt * km1, D + 0.5 * dt * kd1);
        
        let kn3 = fN(N + 0.5 * dt * kn2, M + 0.5 * dt * km2, D + 0.5 * dt * kd2);
        let km3 = fM(N + 0.5 * dt * kn2, M + 0.5 * dt * km2, D + 0.5 * dt * kd2);
        let kd3 = fD(N + 0.5 * dt * kn2, M + 0.5 * dt * km2, D + 0.5 * dt * kd2);
        
        let kn4 = fN(N + dt * kn3, M + dt * km3, D + dt * kd3);
        let km4 = fM(N + dt * km3, M + dt * km3, D + dt * kd3);
        let kd4 = fD(N + dt * kn3, M + dt * km3, D + dt * kd4);

        N += (dt / 6) * (kn1 + 2 * kn2 + 2 * kn3 + kn4);
        M += (dt / 6) * (km1 + 2 * km2 + 2 * km3 + km4);
        D += (dt / 6) * (kd1 + 2 * kd2 + 2 * kd3 + kd4);
    }

    // Renderizado seguro en el hilo aislado
    actualizarLienzoEdo("graficoReservas", {
        type: 'line',
        data: {
            labels: ejeTiempo,
            datasets: [{ label: 'Reservas (Litros)', data: histReservas, borderColor: '#ff9f40', fill: false }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    actualizarLienzoEdo("graficoSocial", {
        type: 'line',
        data: {
            labels: ejeTiempo,
            datasets: [
                { label: 'Neutrales', data: histNeutrales, borderColor: '#36a2eb', fill: false },
                { label: 'Manifestantes', data: histManifestantes, borderColor: '#ff6384', fill: false },
                { label: 'Mediadores', data: histMediadores, borderColor: '#4bc0c0', fill: false }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// Disparador automático para el Módulo 5 al cargar la ventana
window.addEventListener("DOMContentLoaded", () => {
    ejecutarEDO();
});