#!/bin/bash

set -e

CHANNEL_NAME=${1:-"productledger-channel"}
CHAINCODE_NAME=${2:-"productledger"}

echo "=========================================="
echo "Testing Chaincode: $CHAINCODE_NAME"
echo "=========================================="

# Test CreateMegaQR
echo ""
echo "Test 1: CreateMegaQR"
docker exec cli peer chaincode invoke \
    -o orderer.example.com:7050 \
    -C $CHANNEL_NAME \
    -n $CHAINCODE_NAME \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
    --peerAddresses peer0.org1.example.com:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    --peerAddresses peer0.org2.example.com:9051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
    -c '{"function":"CreateMegaQR","Args":["{\"product\":\"Test Product\",\"batchNo\":\"BATCH001\",\"mfgDate\":\"2024-01-01\",\"expiryDate\":\"2025-01-01\",\"manufacturerName\":\"Test Manufacturer\"}"]}'

sleep 3

# Query GetMegaQR (will need to get the MegaID from previous response)
echo ""
echo "Test 2: Query all MegaQRs"
docker exec cli peer chaincode query \
    -C $CHANNEL_NAME \
    -n $CHAINCODE_NAME \
    -c '{"function":"GetAllMegaQRs","Args":[]}'

echo ""
echo "=========================================="
echo "Chaincode testing complete!"
echo "=========================================="

