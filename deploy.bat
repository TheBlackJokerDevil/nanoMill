call npm
call npm install ./app --global --save
call electron-packager ./app nanoMill --all --asar --electron-version=1.6.2 --overwrite --out=./build/ --icon=./app/icon/icon
pause