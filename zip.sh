#!/bin/bash
java -jar ~/tmp/compiler.jar --js client.js --js_output_file min/client.js
java -jar ~/tmp/compiler.jar --js client.js --js_output_file min/client.js

cd min
zip -D js13k.zip *
mv js13k.zip ..
cd ..
ls -lh js13k.zip

