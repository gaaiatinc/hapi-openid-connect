#!/bin/bash
#

export ARTIFACT_NAME_PREFIX=../config/oidc/sampleapp

# Generate private key, make it have no password
openssl genrsa -aes256 -passout pass:x -out "${ARTIFACT_NAME_PREFIX}.pass.key" 4096
openssl rsa -passin pass:x -in ${ARTIFACT_NAME_PREFIX}.pass.key -out ${ARTIFACT_NAME_PREFIX}-key.pem
rm ${ARTIFACT_NAME_PREFIX}.pass.key

# Generate public key
openssl rsa -in ${ARTIFACT_NAME_PREFIX}-key.pem -outform PEM -pubout -out ${ARTIFACT_NAME_PREFIX}-pub.pem
