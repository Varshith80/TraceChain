#!/bin/bash

set -e

CHANNEL_NAME=${1:-"productledger-channel"}

echo "=========================================="
echo "Deploying Channel: $CHANNEL_NAME"
echo "=========================================="

# Wait for orderer to be ready
echo "Waiting for orderer to be ready..."
sleep 10

# Create channel from Org1
echo ""
echo "Step 1: Creating channel from Org1..."
docker exec cli peer channel create \
    -o orderer.example.com:7050 \
    -c $CHANNEL_NAME \
    -f ./channel-artifacts/${CHANNEL_NAME}.tx \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Join Org1 peer to channel
echo ""
echo "Step 2: Joining Org1 peer to channel..."
docker exec cli peer channel join \
    -b ${CHANNEL_NAME}.block \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Update anchor peer for Org1
echo ""
echo "Step 3: Updating anchor peer for Org1..."
docker exec cli peer channel update \
    -o orderer.example.com:7050 \
    -c $CHANNEL_NAME \
    -f ./channel-artifacts/Org1MSPanchors.tx \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Switch to Org2 context
echo ""
echo "Step 4: Switching to Org2 context..."
docker exec -e CORE_PEER_LOCALMSPID=Org2MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp \
    -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
    cli peer channel join \
    -b ${CHANNEL_NAME}.block \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Update anchor peer for Org2
echo ""
echo "Step 5: Updating anchor peer for Org2..."
docker exec -e CORE_PEER_LOCALMSPID=Org2MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp \
    -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
    cli peer channel update \
    -o orderer.example.com:7050 \
    -c $CHANNEL_NAME \
    -f ./channel-artifacts/Org2MSPanchors.tx \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

echo ""
echo "=========================================="
echo "Channel deployment complete!"
echo "=========================================="
echo "Channel: $CHANNEL_NAME"
echo "Both organizations have joined the channel."

