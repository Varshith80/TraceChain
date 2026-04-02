#!/bin/bash

set -e

CHANNEL_NAME=${1:-"productledger-channel"}
CHAINCODE_NAME=${2:-"productledger"}
CHAINCODE_VERSION=${3:-"1.0"}
CHAINCODE_PATH=${4:-"github.com/chaincode"}
CHAINCODE_SEQUENCE=${5:-"1"}

echo "=========================================="
echo "Deploying Chaincode: $CHAINCODE_NAME"
echo "=========================================="

# Package chaincode
echo ""
echo "Step 1: Packaging chaincode..."
docker exec cli peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
    --path /opt/gopath/src/${CHAINCODE_PATH} \
    --lang golang \
    --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}

# Install on Org1 peer
echo ""
echo "Step 2: Installing chaincode on Org1 peer..."
docker exec cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Get package ID
PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep -oP "${CHAINCODE_NAME}_${CHAINCODE_VERSION}:\K[a-f0-9]+")
echo "Package ID: $PACKAGE_ID"

# Approve for Org1
echo ""
echo "Step 3: Approving chaincode for Org1..."
docker exec cli peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --package-id $PACKAGE_ID \
    --sequence ${CHAINCODE_SEQUENCE} \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Install on Org2 peer
echo ""
echo "Step 4: Installing chaincode on Org2 peer..."
docker exec -e CORE_PEER_LOCALMSPID=Org2MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp \
    -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
    cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Get package ID for Org2
PACKAGE_ID_ORG2=$(docker exec -e CORE_PEER_LOCALMSPID=Org2MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp \
    -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
    cli peer lifecycle chaincode queryinstalled | grep -oP "${CHAINCODE_NAME}_${CHAINCODE_VERSION}:\K[a-f0-9]+")
echo "Package ID (Org2): $PACKAGE_ID_ORG2"

# Approve for Org2
echo ""
echo "Step 5: Approving chaincode for Org2..."
docker exec -e CORE_PEER_LOCALMSPID=Org2MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp \
    -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
    cli peer lifecycle chaincode approveformyorg \
    -o orderer.example.com:7050 \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --package-id $PACKAGE_ID_ORG2 \
    --sequence ${CHAINCODE_SEQUENCE} \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Commit chaincode
echo ""
echo "Step 6: Committing chaincode definition..."
docker exec cli peer lifecycle chaincode commit \
    -o orderer.example.com:7050 \
    --channelID $CHANNEL_NAME \
    --name $CHAINCODE_NAME \
    --version $CHAINCODE_VERSION \
    --sequence ${CHAINCODE_SEQUENCE} \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses peer0.org2.example.com:9051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

echo ""
echo "=========================================="
echo "Chaincode deployment complete!"
echo "=========================================="
echo "Chaincode: $CHAINCODE_NAME v$CHAINCODE_VERSION"
echo "Sequence: $CHAINCODE_SEQUENCE"
echo "Channel: $CHANNEL_NAME"

