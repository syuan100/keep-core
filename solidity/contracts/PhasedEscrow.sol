pragma solidity 0.5.17;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

// @title PhasedEscrow
// @notice A token holder contract allowing contract owner to set beneficiary of
//         tokens held by the contract and allowing the owner to withdraw the
//         tokens to that beneficiary in phases.
contract PhasedEscrow is Ownable {
    using SafeERC20 for IERC20;

    event BeneficiaryUpdated(address beneficiary);
    event TokensWithdrawn(address beneficiary, uint256 amount);

    IERC20 public token;
    address public beneficiary;

    constructor(IERC20 _token) public {
        token = _token;
    }

    // @notice Sets the provided address as a beneficiary allowing it to
    //         withdraw all tokens from escrow. This function can be called only
    //         by escrow owner.
    function setBeneficiary(address _beneficiary) public onlyOwner {
        beneficiary = _beneficiary;
        emit BeneficiaryUpdated(beneficiary);
    }

    // @notice Withdraws the specified number of tokens from escrow to the
    //         beneficiary. If the beneficiary is not set, or there are
    //         insufficient tokens in escrow, the function fails.
    function withdraw(uint256 amount) public onlyOwner {
        require(beneficiary != address(0), "Beneficiary not assigned");

        uint256 balance = token.balanceOf(address(this));
        require(amount <= balance, "Not enough tokens for withdrawal");

        token.safeTransfer(beneficiary, amount);
        emit TokensWithdrawn(beneficiary, amount);
    }
}
