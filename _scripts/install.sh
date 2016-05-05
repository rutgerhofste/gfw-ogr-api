#!/bin/bash
set -x

ssh-keyscan -H $DEPLOY_HOST >> $HOME/.ssh/known_hosts
# Import the SSH deployment key
openssl aes-256-cbc -K $encrypted_da3b25071652_key -iv $encrypted_da3b25071652_iv -in deploy-key.enc -out deploy-key -d
rm deploy-key.enc # Don't need it anymore
chmod 600 deploy-key
mv deploy-key ~/.ssh/id_rsa
