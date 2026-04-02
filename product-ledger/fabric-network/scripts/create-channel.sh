#!/bin/bash

set -e

CHANNEL_NAME=${1:-"productledger-channel"}

echo "Creating channel: $CHANNEL_NAME"

# Set FABRIC_CFG_PATH
export FABRIC_CFG_PATH=${PWD}

# Generate channel creation transaction
configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME

echo "Channel creation transaction generated: channel-artifacts/${CHANNEL_NAME}.tx"

