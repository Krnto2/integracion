import mysql.connector
from flask import Flask, jsonify, request, render_template

app = Flask(__name__)

# Función para obtener datos desde la base de datos (Casa Matriz)
def obtener_casa_matriz():
    conexion = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # Cambia si tienes contraseña
        database="inventario_db"
    )
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT cantidad, precio FROM casa_matriz LIMIT 1")
    resultado = cursor.fetchone()
    cursor.close()
    conexion.close()
    return resultado

# Función para actualizar el stock de la Casa Matriz
def actualizar_casa_matriz(nueva_cantidad):
    conexion = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="inventario_db"
    )
    cursor = conexion.cursor()
    cursor.execute("UPDATE casa_matriz SET cantidad = %s", (nueva_cantidad,))
    conexion.commit()
    cursor.close()
    conexion.close()

# Inventario de sucursales en memoria
inventario = {
    "sucursales": [
        {"id": 1, "nombre": "Sucursal 1", "cantidad": 31, "precio": 333},
        {"id": 2, "nombre": "Sucursal 2", "cantidad": 23, "precio": 222},
        {"id": 3, "nombre": "Sucursal 3", "cantidad": 100, "precio": 1111}
    ]
}

# Ruta principal
@app.route('/')
def index():
    return render_template('index.html')

# Obtener inventario
@app.route('/api/inventario', methods=['GET'])
def get_inventario():
    casa_matriz = obtener_casa_matriz()
    return jsonify({
        "sucursales": inventario["sucursales"],
        "casa_matriz": casa_matriz
    })

# Conversión a USD (simulación)
@app.route('/api/transformar_usd', methods=['POST'])
def transformar_usd():
    data = request.json
    precio_clp = data.get('precio_clp', 0)
    tasa = 900
    precio_usd = round(precio_clp / tasa, 2)
    return jsonify({"precio_usd": precio_usd})

# Endpoint de venta
@app.route('/api/vender', methods=['POST'])
def vender():
    data = request.json
    sucursal_id = data.get('sucursal_id')
    cantidad = data.get('cantidad')

    # Verificar si la venta es desde Casa Matriz
    if sucursal_id == "casa_matriz":
        # Obtener datos desde BD
        casa_matriz = obtener_casa_matriz()
        if not casa_matriz:
            return jsonify({"error": "Casa Matriz no encontrada"}), 404

        stock_actual = casa_matriz['cantidad']

        if stock_actual < cantidad:
            return jsonify({"error": "No hay suficiente stock en Casa Matriz"}), 400

        nuevo_stock = stock_actual - cantidad
        actualizar_casa_matriz(nuevo_stock)

        return jsonify({
            "mensaje": "Venta desde Casa Matriz realizada correctamente",
            "stock_restante": nuevo_stock
        })

    # Venta desde sucursal (memoria)
    sucursal = next((s for s in inventario['sucursales'] if s['id'] == sucursal_id), None)
    if not sucursal:
        return jsonify({"error": "Sucursal no encontrada"}), 404

    if sucursal['cantidad'] < cantidad:
        return jsonify({"error": "No hay suficiente stock en la sucursal"}), 400

    sucursal['cantidad'] -= cantidad
    return jsonify({
        "mensaje": "Venta realizada correctamente",
        "stock_restante": sucursal['cantidad']
    })

if __name__ == '__main__':
    app.run(debug=True)
