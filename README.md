#  Self-Healing Smart Contracts (AI Patch System)

An AI-driven framework that automatically detects vulnerabilities in smart contracts, generates secure patches, and applies them using transparent on-chain governance.

---

##  Overview

Smart contracts are immutable once deployed, making post-deployment bug fixing extremely difficult. This project introduces a **Self-Healing Smart Contract System** that combines **Artificial Intelligence and Blockchain** to enable:

* Automatic vulnerability detection
* AI-based patch generation
* Secure redeployment
* On-chain patch approval and tracking

---

##  Features

*  **AI Vulnerability Detection** (Reentrancy, etc.)
*  **Automated Patch Generation**
*  **Hardhat-based Deployment Pipeline**
*  **On-chain PatchManager Governance**
*  **Self-Healing Execution Flow**

---

##  Tech Stack

* **Solidity** – Smart Contracts
* **Python** – AI Detection & Patch Generation
* **Hardhat** – Ethereum Development Environment
* **Node.js / npm** – Project Management
* **Local Ethereum Network** – Testing

---

##  Project Structure

```
self-healing-smart-contracts-ai/
│
├── ai-module/
│   ├── detector.py
│   ├── patch_generator.py
│   └── ai_orchestrator.py
│
├── blockchain/
│   ├── contracts/
│   │   ├── VulnerableContract.sol
│   │   ├── PatchedContract_auto.sol
│   │   └── PatchManager.sol
│   │
│   ├── scripts/
│   │   ├── deploy_auto.js
│   │   └── approveAndApply.js
│
├── output/
│   └── report.json
│
├── README.md
└── package.json
```

---

##  Setup & Installation

###  Install Dependencies

```bash
npm install
pip install -r requirements.txt
```

---

##  Running the Project

###  Step 1: Start Local Blockchain

```bash
cd blockchain
npx hardhat node
```

---

###  Step 2: Run AI Detection

```bash
cd ai-module
python detector.py ../blockchain/contracts/VulnerableContract.sol
```

---

###  Step 3: Generate Patch

```bash
python patch_generator.py --type reentrancy --output ../blockchain/contracts/PatchedContract_auto.sol
```

---

###  Step 4: Compile Contracts

```bash
cd ../blockchain
npx hardhat compile --force
```

---

###  Step 5: Deploy Contracts

```bash
npx hardhat run scripts/deploy_auto.js --network localhost
```

---

###  Step 6: Apply Patch (On-Chain)

```bash
npx hardhat run scripts/approveAndApply.js --network localhost
```

---

##  One-Command Automation (Optional)

```bash
cd ai-module
python ai_orchestrator.py
```

---

##  System Workflow

```
Smart Contract → AI Detection → Patch Generation → Compile → Deploy → On-chain Approval → Self-Healing
```

---

##  Example Vulnerability

* **Reentrancy Attack**
* External call before state update
* Automatically patched using secure logic

---

##  Results

* ✔ Successful vulnerability detection
* ✔ Automated patch generation
* ✔ Secure redeployment
* ✔ Transparent on-chain patch tracking

---

##  Key Contributions

* Hybrid **AI + Blockchain** security framework
* Autonomous **self-healing smart contracts**
* On-chain **governance for patch approval**
* End-to-end **automated security pipeline**

---

##  Future Scope

* Multi-vulnerability support
* DAO-based governance
* Cross-chain compatibility
* Formal verification integration

---

##  Author

**Sohan Kamble**

---

##  If you like this project

Give it a ⭐ on GitHub and share it!

---
