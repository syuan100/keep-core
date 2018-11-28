package gjkr

import (
	"encoding/binary"
	"math/big"

	"github.com/keep-network/keep-core/pkg/beacon/relay/gjkr/gen/pb"
	"github.com/keep-network/keep-core/pkg/net/ephemeral"
)

func (epkm *EphemeralPublicKeyMessage) Type() string {
	return "dkg/ephemeral_public_key"
}

func (epkm *EphemeralPublicKeyMessage) Marshal() ([]byte, error) {
	return (&pb.EphemeralPublicKey{
		SenderID:           memberIDToBytes(epkm.senderID),
		ReceiverID:         memberIDToBytes(epkm.receiverID),
		EphemeralPublicKey: epkm.ephemeralPublicKey.Marshal(),
	}).Marshal()
}

func (epkm *EphemeralPublicKeyMessage) Unmarshal(bytes []byte) error {
	pbMsg := pb.EphemeralPublicKey{}
	err := pbMsg.Unmarshal(bytes)
	if err != nil {
		return err
	}

	ephemeralPublicKey, err := ephemeral.UnmarshalPublicKey(
		pbMsg.EphemeralPublicKey,
	)
	if err != nil {
		return err
	}

	epkm.senderID = bytesToMemberID(pbMsg.SenderID)
	epkm.receiverID = bytesToMemberID(pbMsg.ReceiverID)
	epkm.ephemeralPublicKey = ephemeralPublicKey

	return nil
}

func (mcm *MemberCommitmentsMessage) Marshal() ([]byte, error) {
	commitmentBytes := make([][]byte, 0, len(mcm.commitments))
	for _, commitment := range mcm.commitments {
		commitmentBytes = append(commitmentBytes, commitment.Bytes())
	}

	return (&pb.MemberCommitments{
		SenderID:    memberIDToBytes(mcm.senderID),
		Commitments: commitmentBytes,
	}).Marshal()
}

func (mcm *MemberCommitmentsMessage) Unmarshal(bytes []byte) error {
	pbMsg := pb.MemberCommitments{}
	err := pbMsg.Unmarshal(bytes)
	if err != nil {
		return err
	}

	mcm.senderID = bytesToMemberID(pbMsg.SenderID)

	var commitments []*big.Int
	for _, commitmentBytes := range pbMsg.Commitments {
		commitment := new(big.Int).SetBytes(commitmentBytes)
		commitments = append(commitments, commitment)
	}
	mcm.commitments = commitments

	return nil
}

func (psm *PeerSharesMessage) Marshal() ([]byte, error) {
	return (&pb.PeerShares{
		SenderID:        memberIDToBytes(psm.senderID),
		ReceiverID:      memberIDToBytes(psm.receiverID),
		EncryptedShareS: psm.encryptedShareS,
		EncryptedShareT: psm.encryptedShareT,
	}).Marshal()
}

func (psm *PeerSharesMessage) Unmarshal(bytes []byte) error {
	pbMsg := pb.PeerShares{}
	err := pbMsg.Unmarshal(bytes)
	if err != nil {
		return err
	}

	psm.senderID = bytesToMemberID(pbMsg.SenderID)
	psm.receiverID = bytesToMemberID(pbMsg.ReceiverID)
	psm.encryptedShareS = pbMsg.EncryptedShareS
	psm.encryptedShareT = pbMsg.EncryptedShareT

	return nil
}

func (ssam *SecretSharesAccusationsMessage) Marshal() ([]byte, error) {
	accusedIDsBytes := make([][]byte, 0, len(ssam.accusedIDs))
	for _, accusedID := range ssam.accusedIDs {
		accusedIDsBytes = append(accusedIDsBytes, memberIDToBytes(accusedID))
	}

	return (&pb.SecretSharesAccusations{
		SenderID:   memberIDToBytes(ssam.senderID),
		AccusedIDs: accusedIDsBytes,
	}).Marshal()
}

func (ssam *SecretSharesAccusationsMessage) Unmarshal(bytes []byte) error {
	pbMsg := pb.SecretSharesAccusations{}
	err := pbMsg.Unmarshal(bytes)
	if err != nil {
		return err
	}

	ssam.senderID = bytesToMemberID(pbMsg.SenderID)

	var accusedIDs []MemberID
	for _, accusedIDBytes := range pbMsg.AccusedIDs {
		accusedIDs = append(accusedIDs, bytesToMemberID(accusedIDBytes))
	}
	ssam.accusedIDs = accusedIDs

	return nil
}

func (mpspm *MemberPublicKeySharePointsMessage) Marshal() ([]byte, error) {
	keySharePoints := make([][]byte, 0, len(mpspm.publicKeySharePoints))
	for _, keySharePoint := range mpspm.publicKeySharePoints {
		keySharePoints = append(keySharePoints, keySharePoint.Bytes())
	}

	return (&pb.MemberPublicKeySharePoints{
		SenderID:             memberIDToBytes(mpspm.senderID),
		PublicKeySharePoints: keySharePoints,
	}).Marshal()
}

func (mpspm *MemberPublicKeySharePointsMessage) Unmarshal(bytes []byte) error {
	pbMsg := pb.MemberPublicKeySharePoints{}
	err := pbMsg.Unmarshal(bytes)
	if err != nil {
		return err
	}

	mpspm.senderID = bytesToMemberID(pbMsg.SenderID)

	var keySharePoints []*big.Int
	for _, keySharePointBytes := range pbMsg.PublicKeySharePoints {
		keySharePoint := new(big.Int).SetBytes(keySharePointBytes)
		keySharePoints = append(keySharePoints, keySharePoint)
	}
	mpspm.publicKeySharePoints = keySharePoints

	return nil
}

func (pam *PointsAccusationsMessage) Marshal() ([]byte, error) {
	accusedIDsBytes := make([][]byte, 0, len(pam.accusedIDs))
	for _, accusedID := range pam.accusedIDs {
		accusedIDsBytes = append(accusedIDsBytes, memberIDToBytes(accusedID))
	}

	return (&pb.PointsAccusations{
		SenderID:   memberIDToBytes(pam.senderID),
		AccusedIDs: accusedIDsBytes,
	}).Marshal()
}

func (pam *PointsAccusationsMessage) Unmarshal(bytes []byte) error {
	pbMsg := pb.PointsAccusations{}
	err := pbMsg.Unmarshal(bytes)
	if err != nil {
		return err
	}

	pam.senderID = bytesToMemberID(pbMsg.SenderID)

	var accusedIDs []MemberID
	for _, accusedIDBytes := range pbMsg.AccusedIDs {
		accusedIDs = append(accusedIDs, bytesToMemberID(accusedIDBytes))
	}
	pam.accusedIDs = accusedIDs

	return nil
}

func memberIDToBytes(memberID MemberID) []byte {
	bytes := make([]byte, 4)
	binary.LittleEndian.PutUint32(bytes, uint32(memberID))
	return bytes
}

func bytesToMemberID(bytes []byte) MemberID {
	return MemberID(binary.LittleEndian.Uint32(bytes))
}
