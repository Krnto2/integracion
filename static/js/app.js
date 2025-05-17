document.addEventListener('DOMContentLoaded', function() {
    cargarInventario();
    document.getElementById('calcular').addEventListener('click', calcularTotal);
    document.getElementById('vender').addEventListener('click', realizarVenta);
    document.getElementById('buscar').addEventListener('input', filtrarSucursales);
});

let inventario = {
    sucursales: [],
    casa_matriz: {}
};

function cargarInventario() {
    fetch('/api/inventario')
        .then(response => response.json())
        .then(data => {
            inventario = data;
            mostrarInventario(data);
        })
        .catch(error => console.error('Error al cargar inventario:', error));
}

function mostrarInventario(data) {
    const sucursalesContainer = document.getElementById('sucursales-container');
    const casaMatrizContainer = document.getElementById('casa-matriz-container');
    
    sucursalesContainer.innerHTML = '';
    casaMatrizContainer.innerHTML = '';
    
    data.sucursales.forEach(sucursal => {
        const divSucursal = document.createElement('div');
        divSucursal.className = 'sucursal';
        divSucursal.innerHTML = `${sucursal.nombre}<br>Cant: ${sucursal.cantidad} | Precio: ${sucursal.precio}`;
        sucursalesContainer.appendChild(divSucursal);
    });
    
    const divCasaMatriz = document.createElement('div');
    divCasaMatriz.className = 'sucursal';
    divCasaMatriz.innerHTML = `Casa Matriz<br>Cant: ${data.casa_matriz.cantidad} | Precio: ${data.casa_matriz.precio}`;
    casaMatrizContainer.appendChild(divCasaMatriz);
}

function filtrarSucursales() {
    const textoBusqueda = document.getElementById('buscar').value.toLowerCase();
    const sucursalesContainer = document.getElementById('sucursales-container');
    
    sucursalesContainer.innerHTML = '';
    
    inventario.sucursales.forEach(sucursal => {
        if (sucursal.nombre.toLowerCase().includes(textoBusqueda)) {
            const divSucursal = document.createElement('div');
            divSucursal.className = 'sucursal';
            divSucursal.innerHTML = `${sucursal.nombre}<br>Cant: ${sucursal.cantidad} | Precio: ${sucursal.precio}`;
            sucursalesContainer.appendChild(divSucursal);
        }
    });
}

function calcularTotal() {
    const sucursalId = document.getElementById('sucursal').value;
    const cantidad = parseInt(document.getElementById('cantidad').value);
    
    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor ingrese una cantidad válida');
        return;
    }

    let precio = 0;
    
    if (sucursalId === 'casa_matriz') {
        precio = inventario.casa_matriz.precio;
    } else {
        const sucursal = inventario.sucursales.find(s => s.id == sucursalId);
        if (sucursal) {
            precio = sucursal.precio;
        }
    }
    
    const total = precio * cantidad;
    document.getElementById('total').textContent = total;
    
    fetch('/api/transformar_usd', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ precio_clp: total })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('totalUSD').textContent = data.precio_usd;
    })
    .catch(error => console.error('Error al convertir a USD:', error));
}

function realizarVenta() {
    const sucursalIdRaw = document.getElementById('sucursal').value;
    const cantidad = parseInt(document.getElementById('cantidad').value);

    if (isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor ingrese una cantidad válida');
        return;
    }

    const data = {
        sucursal_id: sucursalIdRaw === 'casa_matriz' ? 'casa_matriz' : parseInt(sucursalIdRaw),
        cantidad: cantidad
    };

    fetch('/api/vender', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error) });
        }
        return response.json();
    })
    .then(data => {
        alert(data.mensaje);
        cargarInventario(); // Actualizar
    })
    .catch(error => {
        alert('Error: ' + error.message);
    });
}
