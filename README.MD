# Entorno Local para LaTeX con Visual Studio Code

Esta guía detalla los pasos necesarios para configurar un entorno de compilación local para documentos LaTeX en Windows utilizando Visual Studio Code. Este setup utiliza `latexmk` para automatizar la compilación de bibliografías, índices y referencias cruzadas sin necesidad de ejecutar múltiples comandos manuales.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
* [Visual Studio Code](https://code.visualstudio.com/)

---

## Guía de Instalación Paso a Paso

### 1. Instalar la Distribución de LaTeX (MiKTeX)
MiKTeX es el "motor" que se encarga de procesar el código y descargar los paquetes (`\usepackage{}`) automáticamente cuando se necesitan.

1. Descarga el instalador desde la página oficial de [MiKTeX](https://miktex.org/download).
2. Ejecuta el instalador (puedes instalarlo solo para tu usuario).
3. Una vez instalado, abre **MiKTeX Console** desde el menú de inicio de Windows.
4. Ve a la pestaña **Updates**, haz clic en **Check for updates** y aplica cualquier actualización pendiente.

### 2. Instalar Perl (Requerido para `latexmk`)
La extensión de VS Code utiliza la herramienta `latexmk`, la cual está escrita en Perl. Windows no incluye este lenguaje de forma nativa.

1. Descarga el instalador de [Strawberry Perl](https://strawberryperl.com/) (versión de 64-bit).
2. Ejecuta el instalador y sigue los pasos (se agregará automáticamente a las variables de entorno `PATH`).
3. **Importante:** Reinicia tu computadora o cierra completamente Visual Studio Code para que el sistema reconozca la nueva variable de entorno.

### 3. Configurar Visual Studio Code
1. Abre VS Code.
2. Ve a la sección de **Extensiones** (`Ctrl + Shift + X`).
3. Busca e instala la extensión **LaTeX Workshop** (creada por James Yu).

### 4. Compilar el Proyecto
1. Abre la carpeta de tu proyecto de LaTeX en VS Code.
2. Abre tu archivo principal (por ejemplo, `main.tex`).
3. Para compilar el documento y generar el PDF, haz clic en el botón verde de "Play" (Build LaTeX project) en la esquina superior derecha, o presiona `Ctrl + Alt + B`.
4. Para ver el PDF integrado en VS Code, haz clic en el ícono de la lupa con el PDF (View LaTeX PDF) en la esquina superior derecha.

---

## 🛠️ Comandos Útiles y Solución de Problemas

### Limpieza de Archivos Temporales
Durante la compilación, LaTeX genera muchos archivos auxiliares (`.aux`, `.bbl`, `.log`, etc.) que a veces pueden corromperse y causar errores de compilación falsos.
* Para limpiarlos: Abre la paleta de comandos en VS Code (`Ctrl + Shift + P`) y ejecuta `LaTeX Workshop: Clean up auxiliary files`.

### Control de Versiones (Git)
Si estás utilizando Git para versionar tu documento, es altamente recomendable ignorar los archivos compilados para mantener el repositorio limpio. Agrega lo siguiente a tu archivo `.gitignore`:

```text
# Archivos temporales de LaTeX
*.aux
*.bbl
*.blg
*.brf
*.idx
*.ilg
*.ind
*.iof
*.log
*.lof
*.lot
*.out
*.toc
*.fls
*.fdb_latexmk
*.synctex.gz
*.pdf