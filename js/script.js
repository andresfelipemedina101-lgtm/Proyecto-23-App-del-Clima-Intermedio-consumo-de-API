

// Clave personal de la API de Visual Crossing.

const API_KEY = "26PXX5FTEBFRFBJC3R6PB6UYC";

// Guardamos la última ubicación consultada para poder usar el botón "Actualizar"
let ubicacionActual = "";

// Obtenemos los elementos del HTML con los que vamos a trabajar
const inputUbicacion = document.getElementById("ubicacion");
const btnBuscar = document.getElementById("btnBuscar");
const btnActualizar = document.getElementById("btnActualizar");
const mensaje = document.getElementById("mensaje");

// Elementos de la tarjeta del clima actual
const seccionActual = document.getElementById("actual");
const ciudad = document.getElementById("ciudad");
const estado = document.getElementById("estado");
const temperatura = document.getElementById("temperatura");
const viento = document.getElementById("viento");
const lluvia = document.getElementById("lluvia");

// Elementos de las tablas de las 24 horas anteriores y siguientes
const seccionAnteriores = document.getElementById("seccionAnteriores");
const seccionSiguientes = document.getElementById("seccionSiguientes");
const tablaAnteriores = document.getElementById("anteriores");
const tablaSiguientes = document.getElementById("siguientes");



// Función principal: pide los datos del clima a la API
// Es "async" porque debe esperar la respuesta de internet

async function obtenerClima(ubicacion) {

    
    mensaje.textContent = "Cargando clima...";

    
    const url = "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/"
        + encodeURIComponent(ubicacion)
        + "/yesterday/tomorrow?unitGroup=metric&include=hours,current&lang=es&contentType=json&key="
        + API_KEY;

    // try/catch sirve para capturar errores (sin internet, ciudad inválida, etc.)
    try {

       
        const respuesta = await fetch(url);

        if (respuesta.status === 401) {
            throw new Error("La API key no es válida. Revisa la constante API_KEY.");
        }

        if (!respuesta.ok) {
            throw new Error("No se encontró la ubicación. Intenta con otra ciudad.");
        }

        const datos = await respuesta.json();

        ubicacionActual = ubicacion;

        // Mostramos la información en la página
        mostrarActual(datos);
        mostrarHoras(datos);

        // Indicamos la hora en que se actualizaron los datos
        mensaje.textContent = "Datos actualizados a las " + new Date().toLocaleTimeString();

    } catch (error) {

        mensaje.textContent = error.message;
    }
}



function mostrarActual(datos) {

    const actual = datos.currentConditions;

    ciudad.textContent = datos.resolvedAddress;

    estado.textContent = actual.conditions;

    // Temperatura, velocidad del viento y probabilidad de lluvia
    temperatura.textContent = actual.temp + " °C";
    viento.textContent = actual.windspeed + " km/h";
    lluvia.textContent = actual.precipprob + " %";

    seccionActual.classList.remove("oculto");
}



// Muestra las 24 horas anteriores y las 24 horas siguientes
function mostrarHoras(datos) {

    
    const ahora = Date.now() / 1000;

    const unDia = 24 * 60 * 60;

    // Limpiamos las tablas antes de llenarlas de nuevo
    tablaAnteriores.innerHTML = "";
    tablaSiguientes.innerHTML = "";

    // La API devuelve 3 días (ayer, hoy y mañana) y cada día tiene sus horas.
    
    for (let i = 0; i < datos.days.length; i++) {
        const dia = datos.days[i];

        // ...y dentro de cada día recorremos cada hora
        for (let j = 0; j < dia.hours.length; j++) {
            const hora = dia.hours[j];

            // "datetimeEpoch" es el momento exacto de esa hora en segundos
            const momento = hora.datetimeEpoch;

            // Creamos el texto de la fila: fecha, hora (sin segundos) y los datos del clima
            const fila = "<tr>"
                + "<td>" + dia.datetime + " " + hora.datetime.substring(0, 5) + "</td>"
                + "<td>" + hora.conditions + "</td>"
                + "<td>" + hora.temp + " °C</td>"
                + "<td>" + hora.windspeed + " km/h</td>"
                + "<td>" + hora.precipprob + " %</td>"
                + "</tr>";

            // Si la hora está dentro de las últimas 24 horas, va a la tabla de anteriores
            if (momento > ahora - unDia && momento <= ahora) {
                tablaAnteriores.innerHTML += fila;
            }
            // Si la hora está dentro de las próximas 24 horas, va a la tabla de siguientes
            else if (momento > ahora && momento <= ahora + unDia) {
                tablaSiguientes.innerHTML += fila;
            }
        }
    }

    seccionAnteriores.classList.remove("oculto");
    seccionSiguientes.classList.remove("oculto");
}



function buscar() {

    // trim() quita los espacios al inicio y al final
    const texto = inputUbicacion.value.trim();

    // Validamos que el usuario haya escrito algo
    if (texto === "") {
        mensaje.textContent = "Por favor escribe una ubicación.";
        return;
    }

    // Si escribió algo, consultamos el clima
    obtenerClima(texto);
}




btnBuscar.addEventListener("click", buscar);

inputUbicacion.addEventListener("keydown", function (evento) {
    if (evento.key === "Enter") {
        buscar();
    }
});

btnActualizar.addEventListener("click", function () {

    if (ubicacionActual === "") {
        mensaje.textContent = "Primero busca una ubicación.";
        return;
    }

    obtenerClima(ubicacionActual);
});


--

if (navigator.geolocation) {

    mensaje.textContent = "Obteniendo tu ubicación...";

    // Pedimos la ubicación al navegador (el usuario debe dar permiso)
    navigator.geolocation.getCurrentPosition(
        function (posicion) {
            // Si el usuario acepta, armamos "latitud,longitud" y consultamos el clima
            const coordenadas = posicion.coords.latitude + "," + posicion.coords.longitude;
            obtenerClima(coordenadas);
        },
        function () {
            // Si el usuario no da permiso, le pedimos que escriba una ciudad
            mensaje.textContent = "No se pudo obtener tu ubicación. Escribe una ciudad.";
        }
    );
} else {
    mensaje.textContent = "Tu navegador no permite obtener la ubicación. Escribe una ciudad.";
}
