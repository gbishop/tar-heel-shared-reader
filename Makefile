deploy:
	npm run build
	cp -a ../symbols.dynavox/* build/symbols
	rsync -a --delete-after build/ /var/www/THSR
