#!/bin/bash
#

export ARTIFACT_NAME_PREFIX=../config/oidc/test

# Generate private key, make it have no password
openssl genrsa -aes256 -passout pass:x -out "${ARTIFACT_NAME_PREFIX}.pass.key" 4096
openssl rsa -passin pass:x -in ${ARTIFACT_NAME_PREFIX}.pass.key -out ${ARTIFACT_NAME_PREFIX}-key.pem
rm ${ARTIFACT_NAME_PREFIX}.pass.key

# Generate a CSR
openssl req -new -sha512 -key ${ARTIFACT_NAME_PREFIX}-key.pem -out ${ARTIFACT_NAME_PREFIX}-csr.pem

openssl x509 -req -sha512 -days 3640 -in "${ARTIFACT_NAME_PREFIX}-csr.pem" -signkey "${ARTIFACT_NAME_PREFIX}-key.pem" -out "${ARTIFACT_NAME_PREFIX}-cert.pem"

openssl x509 -in "${ARTIFACT_NAME_PREFIX}-cert.pem" -fingerprint -noout
