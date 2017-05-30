deploy:
	npm run build
	rsync -a build/ /var/www/THSR
