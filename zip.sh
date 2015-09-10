#!/bin/bash

# replace symbols
client="$(cat client.js)"
server="$(cat server.js)"

export IFS=$'\n'
for line in $(cat replace.txt)
do
	if [[ $line = \#* ]];
	then
		continue;
	fi
	find=$(echo $line | cut -d : -f 1);
	replace=$(echo $line | cut -d : -f 2);
	client=$(echo -e "$client" | sed -e "s/$find/$replace/g")
	server=$(echo -e "$server" | sed -e "s/$find/$replace/g")
done

echo -e "$client" > min_client.js
java -jar ~/tmp/compiler.jar --js min_client.js --js_output_file min/client.js

echo -e "$server" > min_server.js
java -jar ~/tmp/compiler.jar --js min_server.js --js_output_file min/server.js

rm js13k.zip
cd min
zip js13k.zip *
mv js13k.zip ~/git/js13k
cd ~/git/js13k
ls -lh js13k.zip

#!/bin/bash
