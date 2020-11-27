// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package abi

import (
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = abi.U256
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
)

// StakeDelegatableABI is the input ABI used to generate the binding from.
const StakeDelegatableABI = "[{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_operator\",\"type\":\"address\"}],\"name\":\"authorizerOf\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_address\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_operator\",\"type\":\"address\"}],\"name\":\"beneficiaryOf\",\"outputs\":[{\"internalType\":\"addresspayable\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"},{\"constant\":true,\"inputs\":[{\"internalType\":\"address\",\"name\":\"_operator\",\"type\":\"address\"}],\"name\":\"ownerOf\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"payable\":false,\"stateMutability\":\"view\",\"type\":\"function\"}]"

// StakeDelegatable is an auto generated Go binding around an Ethereum contract.
type StakeDelegatable struct {
	StakeDelegatableCaller     // Read-only binding to the contract
	StakeDelegatableTransactor // Write-only binding to the contract
	StakeDelegatableFilterer   // Log filterer for contract events
}

// StakeDelegatableCaller is an auto generated read-only Go binding around an Ethereum contract.
type StakeDelegatableCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// StakeDelegatableTransactor is an auto generated write-only Go binding around an Ethereum contract.
type StakeDelegatableTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// StakeDelegatableFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type StakeDelegatableFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// StakeDelegatableSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type StakeDelegatableSession struct {
	Contract     *StakeDelegatable // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// StakeDelegatableCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type StakeDelegatableCallerSession struct {
	Contract *StakeDelegatableCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts           // Call options to use throughout this session
}

// StakeDelegatableTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type StakeDelegatableTransactorSession struct {
	Contract     *StakeDelegatableTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts           // Transaction auth options to use throughout this session
}

// StakeDelegatableRaw is an auto generated low-level Go binding around an Ethereum contract.
type StakeDelegatableRaw struct {
	Contract *StakeDelegatable // Generic contract binding to access the raw methods on
}

// StakeDelegatableCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type StakeDelegatableCallerRaw struct {
	Contract *StakeDelegatableCaller // Generic read-only contract binding to access the raw methods on
}

// StakeDelegatableTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type StakeDelegatableTransactorRaw struct {
	Contract *StakeDelegatableTransactor // Generic write-only contract binding to access the raw methods on
}

// NewStakeDelegatable creates a new instance of StakeDelegatable, bound to a specific deployed contract.
func NewStakeDelegatable(address common.Address, backend bind.ContractBackend) (*StakeDelegatable, error) {
	contract, err := bindStakeDelegatable(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &StakeDelegatable{StakeDelegatableCaller: StakeDelegatableCaller{contract: contract}, StakeDelegatableTransactor: StakeDelegatableTransactor{contract: contract}, StakeDelegatableFilterer: StakeDelegatableFilterer{contract: contract}}, nil
}

// NewStakeDelegatableCaller creates a new read-only instance of StakeDelegatable, bound to a specific deployed contract.
func NewStakeDelegatableCaller(address common.Address, caller bind.ContractCaller) (*StakeDelegatableCaller, error) {
	contract, err := bindStakeDelegatable(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &StakeDelegatableCaller{contract: contract}, nil
}

// NewStakeDelegatableTransactor creates a new write-only instance of StakeDelegatable, bound to a specific deployed contract.
func NewStakeDelegatableTransactor(address common.Address, transactor bind.ContractTransactor) (*StakeDelegatableTransactor, error) {
	contract, err := bindStakeDelegatable(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &StakeDelegatableTransactor{contract: contract}, nil
}

// NewStakeDelegatableFilterer creates a new log filterer instance of StakeDelegatable, bound to a specific deployed contract.
func NewStakeDelegatableFilterer(address common.Address, filterer bind.ContractFilterer) (*StakeDelegatableFilterer, error) {
	contract, err := bindStakeDelegatable(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &StakeDelegatableFilterer{contract: contract}, nil
}

// bindStakeDelegatable binds a generic wrapper to an already deployed contract.
func bindStakeDelegatable(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := abi.JSON(strings.NewReader(StakeDelegatableABI))
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_StakeDelegatable *StakeDelegatableRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _StakeDelegatable.Contract.StakeDelegatableCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_StakeDelegatable *StakeDelegatableRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _StakeDelegatable.Contract.StakeDelegatableTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_StakeDelegatable *StakeDelegatableRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _StakeDelegatable.Contract.StakeDelegatableTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_StakeDelegatable *StakeDelegatableCallerRaw) Call(opts *bind.CallOpts, result interface{}, method string, params ...interface{}) error {
	return _StakeDelegatable.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_StakeDelegatable *StakeDelegatableTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _StakeDelegatable.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_StakeDelegatable *StakeDelegatableTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _StakeDelegatable.Contract.contract.Transact(opts, method, params...)
}

// AuthorizerOf is a free data retrieval call binding the contract method 0xfb1677b1.
//
// Solidity: function authorizerOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableCaller) AuthorizerOf(opts *bind.CallOpts, _operator common.Address) (common.Address, error) {
	var (
		ret0 = new(common.Address)
	)
	out := ret0
	err := _StakeDelegatable.contract.Call(opts, out, "authorizerOf", _operator)
	return *ret0, err
}

// AuthorizerOf is a free data retrieval call binding the contract method 0xfb1677b1.
//
// Solidity: function authorizerOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableSession) AuthorizerOf(_operator common.Address) (common.Address, error) {
	return _StakeDelegatable.Contract.AuthorizerOf(&_StakeDelegatable.CallOpts, _operator)
}

// AuthorizerOf is a free data retrieval call binding the contract method 0xfb1677b1.
//
// Solidity: function authorizerOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableCallerSession) AuthorizerOf(_operator common.Address) (common.Address, error) {
	return _StakeDelegatable.Contract.AuthorizerOf(&_StakeDelegatable.CallOpts, _operator)
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address _address) constant returns(uint256 balance)
func (_StakeDelegatable *StakeDelegatableCaller) BalanceOf(opts *bind.CallOpts, _address common.Address) (*big.Int, error) {
	var (
		ret0 = new(*big.Int)
	)
	out := ret0
	err := _StakeDelegatable.contract.Call(opts, out, "balanceOf", _address)
	return *ret0, err
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address _address) constant returns(uint256 balance)
func (_StakeDelegatable *StakeDelegatableSession) BalanceOf(_address common.Address) (*big.Int, error) {
	return _StakeDelegatable.Contract.BalanceOf(&_StakeDelegatable.CallOpts, _address)
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address _address) constant returns(uint256 balance)
func (_StakeDelegatable *StakeDelegatableCallerSession) BalanceOf(_address common.Address) (*big.Int, error) {
	return _StakeDelegatable.Contract.BalanceOf(&_StakeDelegatable.CallOpts, _address)
}

// BeneficiaryOf is a free data retrieval call binding the contract method 0xba7bffd3.
//
// Solidity: function beneficiaryOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableCaller) BeneficiaryOf(opts *bind.CallOpts, _operator common.Address) (common.Address, error) {
	var (
		ret0 = new(common.Address)
	)
	out := ret0
	err := _StakeDelegatable.contract.Call(opts, out, "beneficiaryOf", _operator)
	return *ret0, err
}

// BeneficiaryOf is a free data retrieval call binding the contract method 0xba7bffd3.
//
// Solidity: function beneficiaryOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableSession) BeneficiaryOf(_operator common.Address) (common.Address, error) {
	return _StakeDelegatable.Contract.BeneficiaryOf(&_StakeDelegatable.CallOpts, _operator)
}

// BeneficiaryOf is a free data retrieval call binding the contract method 0xba7bffd3.
//
// Solidity: function beneficiaryOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableCallerSession) BeneficiaryOf(_operator common.Address) (common.Address, error) {
	return _StakeDelegatable.Contract.BeneficiaryOf(&_StakeDelegatable.CallOpts, _operator)
}

// OwnerOf is a free data retrieval call binding the contract method 0x14afd79e.
//
// Solidity: function ownerOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableCaller) OwnerOf(opts *bind.CallOpts, _operator common.Address) (common.Address, error) {
	var (
		ret0 = new(common.Address)
	)
	out := ret0
	err := _StakeDelegatable.contract.Call(opts, out, "ownerOf", _operator)
	return *ret0, err
}

// OwnerOf is a free data retrieval call binding the contract method 0x14afd79e.
//
// Solidity: function ownerOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableSession) OwnerOf(_operator common.Address) (common.Address, error) {
	return _StakeDelegatable.Contract.OwnerOf(&_StakeDelegatable.CallOpts, _operator)
}

// OwnerOf is a free data retrieval call binding the contract method 0x14afd79e.
//
// Solidity: function ownerOf(address _operator) constant returns(address)
func (_StakeDelegatable *StakeDelegatableCallerSession) OwnerOf(_operator common.Address) (common.Address, error) {
	return _StakeDelegatable.Contract.OwnerOf(&_StakeDelegatable.CallOpts, _operator)
}
