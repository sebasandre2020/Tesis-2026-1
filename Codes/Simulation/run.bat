@echo off
REM =============================================================================
REM  run.bat — convenience launcher for simulate.py
REM  Activates the local .venv and runs the simulator with sensible defaults
REM  that populate 50 historical readings per node + continuous sampling.
REM
REM  Usage:
REM    run.bat                -> 50 historical + continuous sampling (15s cycle)
REM    run.bat --once         -> single batch of 3 readings, then exits
REM    run.bat --interval 30  -> continuous, 30s between cycles
REM =============================================================================

setlocal

REM Move into the directory containing this script, regardless of where
REM it was invoked from. This way double-clicking from Explorer works.
pushd "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo [run.bat] Virtual environment not found. Creating it...
    py -3 -m venv .venv
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    python -m pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

if "%~1"=="" (
    REM Default: bootstrap 50 historical + continuous sampling
    python simulate.py --bootstrap 50
) else (
    python simulate.py %*
)

popd
endlocal
