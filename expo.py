import tkinter as tk
from tkinter import messagebox
import random
import string

def generar_password():
    # Validar que la longitud sea un número
    try:
        longitud = int(entry_longitud.get())
        if longitud <= 0:
            raise ValueError
    except ValueError:
        messagebox.showerror("Error", "Por favor, ingresa un número entero mayor a 0 para la longitud.")
        return

    # Iniciar con letras minúsculas por defecto
    caracteres = string.ascii_lowercase 

    # Agregar opciones según las casillas seleccionadas
    if var_mayusculas.get():
        caracteres += string.ascii_uppercase
    if var_numeros.get():
        caracteres += string.digits
    if var_simbolos.get():
        caracteres += string.punctuation

    # Generar la contraseña aleatoria
    password = "".join(random.choice(caracteres) for _ in range(longitud))
    
    # Mostrar la contraseña en el cuadro de texto
    entry_resultado.config(state="normal") # Habilitar para escribir
    entry_resultado.delete(0, tk.END)
    entry_resultado.insert(0, password)
    entry_resultado.config(state="readonly") # Proteger contra edición manual

def copiar_portapapeles():
    password = entry_resultado.get()
    if password:
        ventana.clipboard_clear()
        ventana.clipboard_append(password)
        messagebox.showinfo("Éxito", "¡Contraseña copiada al portapapeles!")
    else:
        messagebox.showwarning("Advertencia", "Primero debes generar una contraseña.")

# Configuración principal de la ventana
ventana = tk.Tk()
ventana.title("Generador de Contraseñas - Tumbaco David")
ventana.geometry("350x350")
ventana.resizable(False, False)
ventana.config(padx=20, pady=20)

# Etiqueta y campo de entrada para la longitud
tk.Label(ventana, text="Longitud de la contraseña:").pack(anchor="w", pady=(0, 5))
entry_longitud = tk.Entry(ventana, width=10)
entry_longitud.insert(0, "12")  # Valor por defecto
entry_longitud.pack(anchor="w", pady=(0, 15))

# Variables para las casillas de verificación
var_mayusculas = tk.BooleanVar(value=True)
var_numeros = tk.BooleanVar(value=True)
var_simbolos = tk.BooleanVar(value=True)

# Casillas de verificación
tk.Checkbutton(ventana, text="Incluir mayúsculas (A-Z)", variable=var_mayusculas).pack(anchor="w")
tk.Checkbutton(ventana, text="Incluir números (0-9)", variable=var_numeros).pack(anchor="w")
tk.Checkbutton(ventana, text="Incluir símbolos (!@#$)", variable=var_simbolos).pack(anchor="w", pady=(0, 15))

# Botón para generar
tk.Button(ventana, text="Generar Contraseña", command=generar_password, bg="#4CAF50", fg="white", font=("Arial", 10, "bold")).pack(fill="x", pady=5)

# Cuadro de texto para mostrar el resultado
tk.Label(ventana, text="Tu contraseña generada:").pack(anchor="w", pady=(10, 5))
entry_resultado = tk.Entry(ventana, font=("Consolas", 12), state="readonly", justify="center")
entry_resultado.pack(fill="x", pady=5)

# Botón para copiar al portapapeles (Opcional solicitado)
tk.Button(ventana, text="Copiar al portapapeles", command=copiar_portapapeles).pack(fill="x", pady=10)

# Iniciar el bucle de la aplicación
ventana.mainloop()