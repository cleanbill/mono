touch dist/what 
rm -r dist/* 
tsc -p . 
rm -r ./example/src
cp -r src ./example/. 
./make.sh
