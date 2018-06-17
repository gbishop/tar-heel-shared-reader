deploy:
	npm run build
	cp -a ../symbols.dynavox/* build/symbols
	rsync -a build/ gbserver3:/var/www/shared2.tarheelreader/
	ssh gbserver3 touch /tmp/thsr-activate.reload
