#!/bin/bash

DATA_DIR="$(pwd)/data"

docker run \
	-p 3000:3000 \
	-v $DATA_DIR/:/app/data/ \
	--env-file .env.example \
	goat-gpol:latest
