@echo off
pushd "%~dp0"
node .\node_modules\eslint\bin\eslint.js .
popd
