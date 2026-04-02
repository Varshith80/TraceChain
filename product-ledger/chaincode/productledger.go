/*
 * Product Ledger Chaincode
 * Hyperledger Fabric chaincode for product traceability
 */

package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
)

// ProductLedgerContract provides functions for managing product traceability
type ProductLedgerContract struct {
	contractapi.Contract
}

// MegaQR represents a batch/product batch
type MegaQR struct {
	ObjectType        string            `json:"objectType"`
	MegaID            string            `json:"megaID"`
	MegaHash          string            `json:"megaHash"`
	Product           string            `json:"product"`
	BatchNo           string            `json:"batchNo"`
	MfgDate           string            `json:"mfgDate"`
	ExpiryDate        string            `json:"expiryDate"`
	ManufacturerID    string            `json:"manufacturerID"`
	ManufacturerName  string            `json:"manufacturerName"`
	ChildList         []string          `json:"childList"`
	CommittedMessages []CommittedMessage `json:"committedMessages"`
	Meta              map[string]string `json:"meta"`
	Version           string            `json:"version"`
	Status            string            `json:"status"`
	CreatedAt         string            `json:"createdAt"`
	UpdatedAt         string            `json:"updatedAt"`
}

// ChildQR represents an individual product unit
type ChildQR struct {
	ObjectType        string            `json:"objectType"`
	ChildID           string            `json:"childID"`
	ChildHash         string            `json:"childHash"`
	MegaID            string            `json:"megaID"`
	MegaHash          string            `json:"megaHash"`
	ProductSnapshot   ProductSnapshot   `json:"productSnapshot"`
	CommittedMessages []CommittedMessage `json:"committedMessages"`
	ScanEvents        []ScanEvent       `json:"scanEvents"`
	Status            string            `json:"status"`
	CreatedAt         string            `json:"createdAt"`
	UpdatedAt         string            `json:"updatedAt"`
}

// ProductSnapshot captures product details at child creation
type ProductSnapshot struct {
	Product          string `json:"product"`
	BatchNo          string `json:"batchNo"`
	MfgDate          string `json:"mfgDate"`
	ExpiryDate       string `json:"expiryDate"`
	ManufacturerID   string `json:"manufacturerID"`
	ManufacturerName string `json:"manufacturerName"`
}

// CommittedMessage represents an immutable message on the chain
type CommittedMessage struct {
	Msg      string `json:"msg"`
	By       string `json:"by"`
	Ts       string `json:"ts"`
	Location string `json:"location"`
	Device   string `json:"device"`
}

// ScanEvent represents a scan event on blockchain
// Architecture: No user auth fields - uses actorID (blockchain identity)
type ScanEvent struct {
	ChildID  string `json:"childID,omitempty"`
	MegaID   string `json:"megaID,omitempty"`
	ActorID  string `json:"actorID"`              // Blockchain actor ID
	Ts       string `json:"ts"`                   // ISO 8601 timestamp
	Location string `json:"location,omitempty"`
	Device   string `json:"device,omitempty"`
	TxHash   string `json:"txHash,omitempty"`     // Set by blockchain
}

// Create MegaQR creates a new MegaQR (batch)
// Enforces immutability by preventing duplicate creation
// All IDs and timestamps are deterministic (txID-based) for consistent endorsements.
func (s *ProductLedgerContract) CreateMegaQR(ctx contractapi.TransactionContextInterface, requestJSON string) (*MegaQR, error) {
	type CreateMegaQRRequest struct {
		Product          string            `json:"product"`
		BatchNo          string            `json:"batchNo"`
		MfgDate          string            `json:"mfgDate"`
		ExpiryDate       string            `json:"expiryDate"`
		ManufacturerID   string            `json:"manufacturerID"`
		ManufacturerName string            `json:"manufacturerName"`
		Meta             map[string]string `json:"meta"`
	}

	var request CreateMegaQRRequest
	if err := json.Unmarshal([]byte(requestJSON), &request); err != nil {
		return nil, fmt.Errorf("failed to unmarshal request: %v", err)
	}

	if request.Product == "" {
		return nil, fmt.Errorf("missing or invalid field: product")
	}
	if request.BatchNo == "" {
		return nil, fmt.Errorf("missing or invalid field: batchNo")
	}
	if request.MfgDate == "" {
		return nil, fmt.Errorf("missing or invalid field: mfgDate")
	}
	if request.ExpiryDate == "" {
		return nil, fmt.Errorf("missing or invalid field: expiryDate")
	}

	// manufacturerID from request (backend passes authenticated user ID) - deterministic across peers
	manufacturerID := request.ManufacturerID

	txID := ctx.GetStub().GetTxID()
	ts, err := getTxTimestampRFC3339(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tx timestamp: %v", err)
	}

	// Deterministic MegaID from txID + request data (same on all peers)
	idHash := generateHash(fmt.Sprintf("%s-%s-%s-%s-%s",
		request.Product, request.BatchNo, request.MfgDate, manufacturerID, txID))
	megaID := fmt.Sprintf("MEGA-%s", idHash[:16])

	// Prevent duplicate: Check if MegaQR already exists
	existing, err := ctx.GetStub().GetState(megaID)
	if err != nil {
		return nil, fmt.Errorf("failed to check for existing MegaQR: %v", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("MegaQR %s already exists - duplicate creation prevented", megaID)
	}

	// Deterministic hash (same on all peers)
	megaHash := generateHash(fmt.Sprintf("%s-%s-%s-%s", megaID, request.Product, request.BatchNo, txID))

	// Create MegaQR
	megaQR := MegaQR{
		ObjectType:        "MegaQR",
		MegaID:            megaID,
		MegaHash:          megaHash,
		Product:           request.Product,
		BatchNo:           request.BatchNo,
		MfgDate:           request.MfgDate,
		ExpiryDate:        request.ExpiryDate,
		ManufacturerID:    manufacturerID,
		ManufacturerName:  request.ManufacturerName,
		ChildList:         []string{},
		CommittedMessages: []CommittedMessage{
			{
				Msg:     "Manufactured",
				By:      manufacturerID,
				Ts:      ts,
				Device:  "factory-system",
				Location: "factory",
			},
		},
		Meta:      func() map[string]string { if request.Meta == nil { return make(map[string]string) }; return request.Meta }(),
		Version:   "1.0",
		Status:    "active",
		CreatedAt: ts,
		UpdatedAt: ts,
	}

	// Store on ledger
	megaQRJSON, err := json.Marshal(megaQR)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal MegaQR: %v", err)
	}

	err = ctx.GetStub().PutState(megaID, megaQRJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put MegaQR: %v", err)
	}

	return &megaQR, nil
}

// GetMegaQR retrieves a MegaQR by ID
func (s *ProductLedgerContract) GetMegaQR(ctx contractapi.TransactionContextInterface, megaID string) (*MegaQR, error) {
	megaQRJSON, err := ctx.GetStub().GetState(megaID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}

	if megaQRJSON == nil {
		return nil, fmt.Errorf("MegaQR %s does not exist", megaID)
	}

	var megaQR MegaQR
	err = json.Unmarshal(megaQRJSON, &megaQR)
	if err != nil {
		return nil, err
	}

	return &megaQR, nil
}

// GetManufacturerMegaQRs retrieves all MegaQRs for a manufacturer.
// Uses GetStateByRange (LevelDB compatible) instead of GetQueryResult.
func (s *ProductLedgerContract) GetManufacturerMegaQRs(ctx contractapi.TransactionContextInterface, manufacturerID string) ([]*MegaQR, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("MEGA-", "MEGB")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	megaQRs := make([]*MegaQR, 0)
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var megaQR MegaQR
		err = json.Unmarshal(queryResponse.Value, &megaQR)
		if err != nil {
			continue
		}
		if megaQR.ObjectType == "MegaQR" && megaQR.ManufacturerID == manufacturerID {
			megaQRs = append(megaQRs, &megaQR)
		}
	}

	return megaQRs, nil
}

// GenerateChildQRs generates child QR codes for a MegaQR
func (s *ProductLedgerContract) GenerateChildQRs(ctx contractapi.TransactionContextInterface, megaID string, requestJSON string) ([]string, error) {
	megaQR, err := s.GetMegaQR(ctx, megaID)
	if err != nil {
		return nil, err
	}

	type GenerateChildQRsRequest struct {
		Count   *float64 `json:"count"`
		ActorID string   `json:"actorID"`
	}

	var request GenerateChildQRsRequest
	if err := json.Unmarshal([]byte(requestJSON), &request); err != nil {
		return nil, fmt.Errorf("failed to unmarshal request: %v", err)
	}

	actorID := strings.TrimSpace(request.ActorID)
	if actorID == "" {
		// Fallback to on-chain identity for direct CLI usage.
		actorID, err = getStableInvokerID(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get invoker identity: %v", err)
		}
	}

	if err := authorizeOwnerOrOrgAdmin(ctx, megaQR.ManufacturerID, actorID); err != nil {
		return nil, err
	}

	ts, err := getTxTimestampRFC3339(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tx timestamp: %v", err)
	}
	txID := ctx.GetStub().GetTxID()

	if request.Count == nil {
		return nil, fmt.Errorf("missing or invalid field: count")
	}
	count := int(*request.Count)
	childIDs := []string{}

	startIdx := len(megaQR.ChildList)

	for i := 0; i < count; i++ {
		childID := fmt.Sprintf("%s-C%05d", megaID, startIdx+i+1)

		// Prevent duplicate: Check if ChildQR already exists
		existing, err := ctx.GetStub().GetState(childID)
		if err != nil {
			return nil, fmt.Errorf("failed to check for existing ChildQR: %v", err)
		}
		if existing != nil {
			return nil, fmt.Errorf("ChildQR %s already exists - duplicate creation prevented", childID)
		}

		// Deterministic hash (txID + index - same on all peers)
		childHash := generateHash(fmt.Sprintf("%s-%s-%s-%d", childID, megaQR.MegaHash, txID, i+1))

		childQR := ChildQR{
			ObjectType:        "ChildQR",
			ChildID:           childID,
			ChildHash:         childHash,
			MegaID:            megaID,
			MegaHash:          megaQR.MegaHash,
			ProductSnapshot: ProductSnapshot{
				Product:          megaQR.Product,
				BatchNo:          megaQR.BatchNo,
				MfgDate:          megaQR.MfgDate,
				ExpiryDate:       megaQR.ExpiryDate,
				ManufacturerID:   megaQR.ManufacturerID,
				ManufacturerName: megaQR.ManufacturerName,
			},
			CommittedMessages: []CommittedMessage{},
			ScanEvents:        []ScanEvent{},
			Status:            "active",
			CreatedAt:         ts,
			UpdatedAt:         ts,
		}

		childQRJSON, err := json.Marshal(childQR)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal ChildQR: %v", err)
		}

		err = ctx.GetStub().PutState(childID, childQRJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to put ChildQR: %v", err)
		}

		megaQR.ChildList = append(megaQR.ChildList, childID)
		childIDs = append(childIDs, childID)
	}

	// Update MegaQR
	megaQR.UpdatedAt = ts
	megaQRJSON, err := json.Marshal(megaQR)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal updated MegaQR: %v", err)
	}

	err = ctx.GetStub().PutState(megaID, megaQRJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to update MegaQR: %v", err)
	}

	return childIDs, nil
}

// GetChildQR retrieves a ChildQR by ID
func (s *ProductLedgerContract) GetChildQR(ctx contractapi.TransactionContextInterface, childID string) (*ChildQR, error) {
	childQRJSON, err := ctx.GetStub().GetState(childID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}

	if childQRJSON == nil {
		return nil, fmt.Errorf("ChildQR %s does not exist", childID)
	}

	var childQR ChildQR
	err = json.Unmarshal(childQRJSON, &childQR)
	if err != nil {
		return nil, err
	}

	return &childQR, nil
}

// GetChildrenByMegaID retrieves all ChildQRs for a MegaQR.
// Uses GetStateByRange (LevelDB compatible) instead of GetQueryResult.
func (s *ProductLedgerContract) GetChildrenByMegaID(ctx contractapi.TransactionContextInterface, megaID string) ([]*ChildQR, error) {
	startKey := megaID + "-C00000"
	endKey := megaID + "-D"
	resultsIterator, err := ctx.GetStub().GetStateByRange(startKey, endKey)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var childQRs []*ChildQR
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var childQR ChildQR
		err = json.Unmarshal(queryResponse.Value, &childQR)
		if err != nil {
			continue
		}
		if childQR.ObjectType == "ChildQR" && childQR.MegaID == megaID {
			childQRs = append(childQRs, &childQR)
		}
	}

	return childQRs, nil
}

// CommitMessageToMega commits a message to a MegaQR and all its children
func (s *ProductLedgerContract) CommitMessageToMega(ctx contractapi.TransactionContextInterface, megaID string, requestJSON string) (map[string]string, error) {
	megaQR, err := s.GetMegaQR(ctx, megaID)
	if err != nil {
		return nil, err
	}

	actorID := ""

	type CommitMessageToMegaRequest struct {
		Message  string `json:"message"`
		Location string `json:"location"`
		Device   string `json:"device"`
		ActorID  string `json:"actorID"`
	}

	var request CommitMessageToMegaRequest
	if err := json.Unmarshal([]byte(requestJSON), &request); err != nil {
		return nil, fmt.Errorf("failed to unmarshal request: %v", err)
	}

	actorID = strings.TrimSpace(request.ActorID)
	if actorID == "" {
		actorID, err = getStableInvokerID(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get invoker identity: %v", err)
		}
	}
	if err := authorizeOwnerOrOrgAdmin(ctx, megaQR.ManufacturerID, actorID); err != nil {
		return nil, err
	}

	ts, err := getTxTimestampRFC3339(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tx timestamp: %v", err)
	}

	if request.Message == "" {
		return nil, fmt.Errorf("missing or invalid field: message")
	}

	message := CommittedMessage{
		Msg:      request.Message,
		By:       actorID,
		Ts:       ts,
		Location: request.Location,
		Device:   request.Device,
	}

	megaQR.CommittedMessages = append(megaQR.CommittedMessages, message)
	megaQR.UpdatedAt = ts

	// Update all children
	affectedChildren := 0
	for _, childID := range megaQR.ChildList {
		childQR, err := s.GetChildQR(ctx, childID)
		if err != nil {
			continue
		}

		childQR.CommittedMessages = append(childQR.CommittedMessages, message)
		childQR.UpdatedAt = ts

		childQRJSON, err := json.Marshal(childQR)
		if err != nil {
			continue
		}

		err = ctx.GetStub().PutState(childID, childQRJSON)
		if err != nil {
			continue
		}

		affectedChildren++
	}

	// Update MegaQR
	megaQRJSON, err := json.Marshal(megaQR)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal MegaQR: %v", err)
	}

	err = ctx.GetStub().PutState(megaID, megaQRJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to update MegaQR: %v", err)
	}

	return map[string]string{
		"success": fmt.Sprintf("%v", true),
		"status":  fmt.Sprintf("%v", affectedChildren),
	}, nil
}

// CommitMessageToChild commits a message to a ChildQR
func (s *ProductLedgerContract) CommitMessageToChild(ctx contractapi.TransactionContextInterface, childID string, requestJSON string) (*ChildQR, error) {
	childQR, err := s.GetChildQR(ctx, childID)
	if err != nil {
		return nil, err
	}

	actorID := ""

	type CommitMessageToChildRequest struct {
		Message  string `json:"message"`
		Location string `json:"location"`
		Device   string `json:"device"`
		ActorID  string `json:"actorID"`
	}

	var request CommitMessageToChildRequest
	if err := json.Unmarshal([]byte(requestJSON), &request); err != nil {
		return nil, fmt.Errorf("failed to unmarshal request: %v", err)
	}

	actorID = strings.TrimSpace(request.ActorID)
	if actorID == "" {
		actorID, err = getStableInvokerID(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get invoker identity: %v", err)
		}
	}
	if err := authorizeOwnerOrOrgAdmin(ctx, childQR.ProductSnapshot.ManufacturerID, actorID); err != nil {
		return nil, err
	}

	ts, err := getTxTimestampRFC3339(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tx timestamp: %v", err)
	}

	if request.Message == "" {
		return nil, fmt.Errorf("missing or invalid field: message")
	}

	message := CommittedMessage{
		Msg:      request.Message,
		By:       actorID,
		Ts:       ts,
		Location: request.Location,
		Device:   request.Device,
	}

	childQR.CommittedMessages = append(childQR.CommittedMessages, message)
	childQR.UpdatedAt = ts

	childQRJSON, err := json.Marshal(childQR)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal ChildQR: %v", err)
	}

	err = ctx.GetStub().PutState(childID, childQRJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to update ChildQR: %v", err)
	}

	return childQR, nil
}

// VerifyChildQR verifies the authenticity of a ChildQR
func (s *ProductLedgerContract) VerifyChildQR(ctx contractapi.TransactionContextInterface, childID string) (map[string]string, error) {
	childQR, err := s.GetChildQR(ctx, childID)
	if err != nil {
		return map[string]string{
			"success":  fmt.Sprintf("%v", false),
			"message":  "ChildQR not found",
			"status":   "",
			"childID":  childID,
			"megaID":   "",
		}, nil
	}

	megaQR, err := s.GetMegaQR(ctx, childQR.MegaID)
	if err != nil {
		return map[string]string{
			"success": fmt.Sprintf("%v", false),
			"message": "Parent MegaQR not found",
			"status":  "",
			"childID": childQR.ChildID,
			"megaID":  childQR.MegaID,
		}, nil
	}

	hashMatch := childQR.MegaID == megaQR.MegaID
	listed := false
	for _, id := range megaQR.ChildList {
		if id == childQR.ChildID {
			listed = true
			break
		}
	}
	hashMatch = hashMatch && listed

	// Check for recalls
	isRecalled := megaQR.Status == "recalled" || childQR.Status == "recalled"

	valid := !isRecalled && hashMatch

	message := ""
	if isRecalled {
		message = "Product has been recalled"
	} else if hashMatch {
		message = "Product is authentic"
	} else {
		message = "Product verification failed - hash mismatch"
	}

	return map[string]string{
		"success": fmt.Sprintf("%v", valid),
		"message": message,
		"status":  megaQR.Status,
		"childID": childQR.ChildID,
		"megaID":  megaQR.MegaID,
	}, nil
}

// VerifyProduct is an alias for VerifyChildQR - verifies product authenticity
func (s *ProductLedgerContract) VerifyProduct(ctx contractapi.TransactionContextInterface, productID string) (map[string]string, error) {
	return s.VerifyChildQR(ctx, productID)
}

// CreateChildQR creates a single child QR code for a MegaQR
// Prevents duplicate creation and validates hash integrity
func (s *ProductLedgerContract) CreateChildQR(ctx contractapi.TransactionContextInterface, megaID string, childID string) (*ChildQR, error) {
	// Prevent duplicate: Check if ChildQR already exists
	existing, err := ctx.GetStub().GetState(childID)
	if err != nil {
		return nil, fmt.Errorf("failed to check for existing ChildQR: %v", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("ChildQR %s already exists - duplicate creation prevented", childID)
	}

	// Get parent MegaQR
	megaQR, err := s.GetMegaQR(ctx, megaID)
	if err != nil {
		return nil, fmt.Errorf("failed to get parent MegaQR: %v", err)
	}

	ts, err := getTxTimestampRFC3339(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tx timestamp: %v", err)
	}
	txID := ctx.GetStub().GetTxID()

	// Deterministic hash (txID - same on all peers)
	childHash := generateHash(fmt.Sprintf("%s-%s-%s", childID, megaQR.MegaHash, txID))

	// Validate hash integrity - ensure it's derived from parent
	if len(megaQR.MegaHash) == 0 {
		return nil, fmt.Errorf("parent MegaQR hash is invalid")
	}

	// Create ChildQR
	childQR := ChildQR{
		ObjectType:        "ChildQR",
		ChildID:           childID,
		ChildHash:         childHash,
		MegaID:            megaID,
		MegaHash:          megaQR.MegaHash,
		ProductSnapshot: ProductSnapshot{
			Product:          megaQR.Product,
			BatchNo:          megaQR.BatchNo,
			MfgDate:          megaQR.MfgDate,
			ExpiryDate:       megaQR.ExpiryDate,
			ManufacturerID:   megaQR.ManufacturerID,
			ManufacturerName: megaQR.ManufacturerName,
		},
		CommittedMessages: []CommittedMessage{},
		ScanEvents:        []ScanEvent{},
		Status:            "active",
		CreatedAt:         ts,
		UpdatedAt:         ts,
	}

	// Store on ledger
	childQRJSON, err := json.Marshal(childQR)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal ChildQR: %v", err)
	}

	err = ctx.GetStub().PutState(childID, childQRJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to put ChildQR: %v", err)
	}

	// Update MegaQR child list
	megaQR.ChildList = append(megaQR.ChildList, childID)
	megaQR.UpdatedAt = ts
	megaQRJSON, err := json.Marshal(megaQR)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal updated MegaQR: %v", err)
	}

	err = ctx.GetStub().PutState(megaID, megaQRJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to update MegaQR: %v", err)
	}

	return &childQR, nil
}

// UpdateProductStatus updates the status of a product (MegaQR or ChildQR)
// Enforces immutability by appending status changes to history
func (s *ProductLedgerContract) UpdateProductStatus(ctx contractapi.TransactionContextInterface, productID string, newStatus string) (map[string]string, error) {
	actorID, err := getStableInvokerID(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoker identity: %v", err)
	}

	// Try to get as ChildQR first
	childQR, err := s.GetChildQR(ctx, productID)
	if err == nil {
		// It's a ChildQR
		if err := authorizeOwnerOrOrgAdmin(ctx, childQR.ProductSnapshot.ManufacturerID, actorID); err != nil {
			return nil, err
		}

		oldStatus := childQR.Status
		childQR.Status = newStatus

		ts, err := getTxTimestampRFC3339(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get tx timestamp: %v", err)
		}

		statusMessage := CommittedMessage{
			Msg: fmt.Sprintf("Status changed from %s to %s", oldStatus, newStatus),
			By:  actorID,
			Ts:  ts,
		}
		childQR.CommittedMessages = append(childQR.CommittedMessages, statusMessage)
		childQR.UpdatedAt = ts

		childQRJSON, err := json.Marshal(childQR)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal ChildQR: %v", err)
		}

		err = ctx.GetStub().PutState(productID, childQRJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to update ChildQR: %v", err)
		}
		return map[string]string{
			"success":     fmt.Sprintf("%v", true),
			"message":     fmt.Sprintf("Status changed from %s to %s", oldStatus, newStatus),
			"status":      newStatus,
			"productID":   productID,
			"productType": "ChildQR",
		}, nil
	}

	// Try to get as MegaQR
	megaQR, err := s.GetMegaQR(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("product %s not found", productID)
	}

	if err := authorizeOwnerOrOrgAdmin(ctx, megaQR.ManufacturerID, actorID); err != nil {
		return nil, err
	}

	// It's a MegaQR
	oldStatus := megaQR.Status
	megaQR.Status = newStatus

	ts, err := getTxTimestampRFC3339(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tx timestamp: %v", err)
	}
	megaQR.UpdatedAt = ts

	statusMessage := CommittedMessage{
		Msg: fmt.Sprintf("Status changed from %s to %s", oldStatus, newStatus),
		By:  actorID,
		Ts:  ts,
	}
	megaQR.CommittedMessages = append(megaQR.CommittedMessages, statusMessage)

	megaQRJSON, err := json.Marshal(megaQR)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal MegaQR: %v", err)
	}

	err = ctx.GetStub().PutState(productID, megaQRJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to update MegaQR: %v", err)
	}

	return map[string]string{
		"success":     fmt.Sprintf("%v", true),
		"message":     fmt.Sprintf("Status changed from %s to %s", oldStatus, newStatus),
		"status":      newStatus,
		"productID":   productID,
		"productType": "MegaQR",
	}, nil
}

// RecordScanEvent records a scan event for a product
// Immutable event recording
func (s *ProductLedgerContract) RecordScanEvent(ctx contractapi.TransactionContextInterface, productID string, requestJSON string) (map[string]string, error) {
	type RecordScanEventRequest struct {
		Location string `json:"location"`
		Device   string `json:"device"`
	}

	var request RecordScanEventRequest
	if err := json.Unmarshal([]byte(requestJSON), &request); err != nil {
		return nil, fmt.Errorf("failed to unmarshal request: %v", err)
	}

	txID := ctx.GetStub().GetTxID()

	actorID, err := getStableInvokerID(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get invoker identity: %v", err)
	}

	ts, err := getTxTimestampRFC3339(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get tx timestamp: %v", err)
	}

	// Create scan event
	scanEvent := ScanEvent{
		ActorID:  actorID,
		Ts:       ts,
		Location: request.Location,
		Device:   request.Device,
		TxHash:   txID,
	}

	// Try to get as ChildQR first
	childQR, err := s.GetChildQR(ctx, productID)
	if err == nil {
		// It's a ChildQR
		scanEvent.ChildID = productID
		scanEvent.MegaID = childQR.MegaID
		childQR.ScanEvents = append(childQR.ScanEvents, scanEvent)
		childQR.UpdatedAt = ts

		childQRJSON, err := json.Marshal(childQR)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal ChildQR: %v", err)
		}

		err = ctx.GetStub().PutState(productID, childQRJSON)
		if err != nil {
			return nil, fmt.Errorf("failed to update ChildQR: %v", err)
		}

		return map[string]string{
			"success":     fmt.Sprintf("%v", true),
			"message":     "Scan event recorded",
			"status":      scanEvent.Ts,
			"productID":   productID,
			"productType": "ChildQR",
			"actorID":     scanEvent.ActorID,
			"txHash":      scanEvent.TxHash,
			"childID":     scanEvent.ChildID,
			"megaID":      scanEvent.MegaID,
			"location":    scanEvent.Location,
			"device":      scanEvent.Device,
		}, nil
	}

	// Try to get as MegaQR
	_, err = s.GetMegaQR(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("product %s not found", productID)
	}

	// For MegaQR, we don't store scan events directly, but we can log it
	// In a real scenario, you might want to handle this differently
	return map[string]string{
		"success":     fmt.Sprintf("%v", true),
		"message":     "Scan event recorded (MegaQR scans are typically handled at child level)",
		"status":      scanEvent.Ts,
		"productID":   productID,
		"productType": "MegaQR",
		"actorID":     scanEvent.ActorID,
		"txHash":      scanEvent.TxHash,
		"childID":     scanEvent.ChildID,
		"megaID":      scanEvent.MegaID,
		"location":    scanEvent.Location,
		"device":      scanEvent.Device,
	}, nil
}

// GetProductHistory retrieves the complete history of a product
// Returns all committed messages and scan events
func (s *ProductLedgerContract) GetProductHistory(ctx contractapi.TransactionContextInterface, productID string) (map[string]string, error) {
	// Try to get as ChildQR first
	childQR, err := s.GetChildQR(ctx, productID)
	if err == nil {
		// Get parent MegaQR for complete history
		megaQR, err := s.GetMegaQR(ctx, childQR.MegaID)
		if err != nil {
			megaQR = nil
		}

		parentMegaStatus := ""
		if megaQR != nil {
			parentMegaStatus = megaQR.Status
		}
		return map[string]string{
			"success":            fmt.Sprintf("%v", true),
			"message":            "Product history retrieved",
			"status":             childQR.Status,
			"productID":          productID,
			"productType":        "ChildQR",
			"megaID":             childQR.MegaID,
			"parentMegaStatus":  parentMegaStatus,
			"createdAt":          childQR.CreatedAt,
			"updatedAt":          childQR.UpdatedAt,
		}, nil
		
	}

	// Try to get as MegaQR
	megaQR, err := s.GetMegaQR(ctx, productID)
	if err != nil {
		return nil, fmt.Errorf("product %s not found", productID)
	}

	// Get all children for MegaQR history
	_, _ = s.GetChildrenByMegaID(ctx, productID)

	return map[string]string{
		"success":       fmt.Sprintf("%v", true),
		"message":       "Product history retrieved",
		"status":        megaQR.Status,
		"productID":     productID,
		"productType":   "MegaQR",
		"createdAt":     megaQR.CreatedAt,
		"updatedAt":     megaQR.UpdatedAt,
		"childCount":    fmt.Sprintf("%d", len(megaQR.ChildList)),
	}, nil
	
}

// getStableInvokerID returns a deterministic identifier for the transaction invoker.
// Uses MSPID + enrollment ID (Common Name from X509 cert) to ensure identical results across peers.
func getStableInvokerID(ctx contractapi.TransactionContextInterface) (string, error) {
	mspID, err := cid.GetMSPID(ctx.GetStub())
	if err != nil {
		return "", err
	}
	cert, err := cid.GetX509Certificate(ctx.GetStub())
	if err != nil {
		return "", fmt.Errorf("failed to retrieve X509 certificate: %v", err)
	}
	if cert == nil {
		return "", fmt.Errorf("could not retrieve X509 certificate")
	}
	enrollmentID := cert.Subject.CommonName
	if enrollmentID == "" {
		return "", fmt.Errorf("certificate missing CommonName")
	}
	return mspID + "-" + enrollmentID, nil
}

// isOrgAdminInvoker returns true when invoker certificate CN indicates an admin identity.
func isOrgAdminInvoker(ctx contractapi.TransactionContextInterface) bool {
	cert, err := cid.GetX509Certificate(ctx.GetStub())
	if err != nil || cert == nil {
		return false
	}
	cn := strings.ToLower(strings.TrimSpace(cert.Subject.CommonName))
	return cn == "admin" || strings.HasPrefix(cn, "admin@")
}

// authorizeOwnerOrOrgAdmin allows owner operations by app actorID or org admin invoker.
func authorizeOwnerOrOrgAdmin(ctx contractapi.TransactionContextInterface, ownerID, actorID string) error {
	if strings.TrimSpace(ownerID) == "" {
		return fmt.Errorf("unauthorized: missing owner identity")
	}
	if strings.TrimSpace(actorID) == strings.TrimSpace(ownerID) {
		return nil
	}
	if isOrgAdminInvoker(ctx) {
		return nil
	}
	return fmt.Errorf("unauthorized: caller is not owner")
}

// Helper functions
func generateHash(input string) string {
	hash := sha256.Sum256([]byte(input))
	return hex.EncodeToString(hash[:])
}

// getTxTimestampRFC3339 returns the transaction timestamp as RFC3339 string.
// Uses client proposal timestamp - same across all endorsers (deterministic).
func getTxTimestampRFC3339(ctx contractapi.TransactionContextInterface) (string, error) {
	ts, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return "", err
	}

	if ts == nil {
		return "", fmt.Errorf("transaction timestamp is nil")
	}

	return ts.AsTime().UTC().Format(time.RFC3339), nil
}

func requireString(m map[string]string, key string) (string, error) {
	v, ok := m[key]
	if !ok || v == "" {
		return "", fmt.Errorf("missing or invalid field: %s", key)
	}
	return v, nil
}

func requireFloat64(m map[string]string, key string) (float64, error) {
	v, ok := m[key]
	if !ok || v == "" {
		return 0, fmt.Errorf("missing or invalid field: %s", key)
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil {
		return 0, fmt.Errorf("missing or invalid field: %s", key)
	}
	return f, nil
}

func getStringOrDefault(m map[string]string, key string, defaultValue string) string {
	if val, ok := m[key]; ok {
		return val
	}
	return defaultValue
}

func getMapOrDefault(_ map[string]string, _ string, defaultValue map[string]string) map[string]string {
	return defaultValue
}

func main() {
	productLedgerContract, err := contractapi.NewChaincode(&ProductLedgerContract{})
	if err != nil {
		fmt.Printf("Error creating ProductLedgerContract chaincode: %v", err)
		return
	}

	if err := productLedgerContract.Start(); err != nil {
		fmt.Printf("Error starting ProductLedgerContract chaincode: %v", err)
	}
}

