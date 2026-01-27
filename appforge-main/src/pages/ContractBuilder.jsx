import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileCode, Plus, Search, Rocket, Code, Settings2,
  ChevronRight, Users, Clock, Coins, Vote, Gift, Lock,
  CheckCircle, Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import NetworkBadge from '@/components/web3/NetworkBadge';
import EmptyState from '@/components/common/EmptyState';
import DeploymentModal from '@/components/web3/DeploymentModal';
import WalletConnect from '@/components/web3/WalletConnect';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const templates = [
  { value: 'custom', label: 'Custom Contract', icon: FileCode, color: 'from-gray-500 to-gray-600', description: 'Start from scratch' },
  { value: 'multisig', label: 'Multi-Sig Wallet', icon: Users, color: 'from-blue-500 to-indigo-500', description: 'Require multiple signatures' },
  { value: 'vesting', label: 'Token Vesting', icon: Clock, color: 'from-purple-500 to-pink-500', description: 'Time-locked token release' },
  { value: 'staking', label: 'Staking Pool', icon: Coins, color: 'from-green-500 to-emerald-500', description: 'Stake tokens for rewards' },
  { value: 'governance', label: 'Governance', icon: Vote, color: 'from-orange-500 to-red-500', description: 'DAO voting system' },
  { value: 'airdrop', label: 'Airdrop', icon: Gift, color: 'from-pink-500 to-rose-500', description: 'Distribute tokens to users' },
  { value: 'crowdsale', label: 'Crowdsale', icon: Coins, color: 'from-yellow-500 to-orange-500', description: 'Token sale contract' },
  { value: 'timelock', label: 'Timelock', icon: Lock, color: 'from-cyan-500 to-blue-500', description: 'Delayed execution' },
];

const networks = [
  { value: 'ethereum', label: 'Ethereum', icon: '⟠' },
  { value: 'polygon', label: 'Polygon', icon: '⬡' },
  { value: 'bsc', label: 'BNB Chain', icon: '⬡' },
  { value: 'arbitrum', label: 'Arbitrum', icon: '🔷' },
  { value: 'base', label: 'Base', icon: '🔵' },
];

const getTemplateCode = (template) => {
  const codes = {
    custom: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MyContract {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Add your custom logic here
}`,
    multisig: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint amount);
    event Submit(uint indexed txId);
    event Approve(address indexed owner, uint indexed txId);
    event Execute(uint indexed txId);
    
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;
    
    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
    }
    
    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public approved;
    
    constructor(address[] memory _owners, uint _required) {
        require(_owners.length > 0, "owners required");
        require(_required > 0 && _required <= _owners.length, "invalid required");
        
        for (uint i; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "invalid owner");
            require(!isOwner[owner], "owner not unique");
            
            isOwner[owner] = true;
            owners.push(owner);
        }
        required = _required;
    }
    
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}`,
    staking: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StakingPool is ReentrancyGuard {
    IERC20 public stakingToken;
    IERC20 public rewardToken;
    
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    
    constructor(address _stakingToken, address _rewardToken, uint256 _rewardRate) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
    }
    
    function stake(uint256 amount) external nonReentrant {
        totalSupply += amount;
        balances[msg.sender] += amount;
        stakingToken.transferFrom(msg.sender, address(this), amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant {
        totalSupply -= amount;
        balances[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);
    }
}`,
    vesting: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenVesting {
    IERC20 public token;
    
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 duration;
        uint256 released;
    }
    
    mapping(address => VestingSchedule) public vestingSchedules;
    
    constructor(address _token) {
        token = IERC20(_token);
    }
    
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 cliffDuration,
        uint256 duration
    ) external {
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            duration: duration,
            released: 0
        });
        token.transferFrom(msg.sender, address(this), amount);
    }
    
    function release(address beneficiary) external {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        uint256 vested = vestedAmount(beneficiary);
        uint256 releasable = vested - schedule.released;
        schedule.released = vested;
        token.transfer(beneficiary, releasable);
    }
    
    function vestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }
        return (schedule.totalAmount * (block.timestamp - schedule.startTime)) / schedule.duration;
    }
}`,
  };
  return codes[template] || codes.custom;
};

export default function ContractBuilder() {
  const [selectedContract, setSelectedContract] = useState(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('code');
  const [wallet, setWallet] = useState(null);
  const [newContract, setNewContract] = useState({
    name: '',
    description: '',
    template: 'custom',
    network: 'ethereum',
  });

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('projectId');
  const contractIdFromUrl = urlParams.get('contractId');

  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', projectId],
    queryFn: () => base44.entities.SmartContract.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  useEffect(() => {
    if (contractIdFromUrl && contracts.length > 0) {
      const contract = contracts.find(c => c.id === contractIdFromUrl);
      if (contract) setSelectedContract(contract);
    }
  }, [contractIdFromUrl, contracts]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SmartContract.create(data),
    onSuccess: (newContract) => {
      queryClient.invalidateQueries({ queryKey: ['contracts', projectId] });
      setShowNewDialog(false);
      setNewContract({ name: '', description: '', template: 'custom', network: 'ethereum' });
      setSelectedContract(newContract);
      toast.success('Contract created!');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SmartContract.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts', projectId] });
      toast.success('Contract saved!');
    },
  });

  const filteredContracts = contracts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCompile = () => {
    toast.info('Compilation requires backend functions to be enabled.');
  };

  const handleDeploy = () => {
    setShowDeployModal(true);
  };

  const handleDeploymentComplete = async (deploymentData) => {
    const updatedContract = {
      ...selectedContract,
      ...deploymentData,
    };
    await updateMutation.mutateAsync({ id: selectedContract.id, data: updatedContract });
    setSelectedContract(updatedContract);
    toast.success('Contract deployed successfully!');
  };

  const currentTemplate = templates.find(t => t.value === selectedContract?.template) || templates[0];

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <EmptyState icon={FileCode} title="No Project Selected" description="Please select a project to build smart contracts." />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Contracts Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Contracts</h2>
            <Button size="icon" variant="ghost" onClick={() => setShowNewDialog(true)} className="h-8 w-8 rounded-lg">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts..."
              className="pl-9 h-9 rounded-lg bg-gray-50 border-0"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'No contracts found' : 'No contracts yet'}
              </div>
            ) : (
              <AnimatePresence>
                {filteredContracts.map((contract) => {
                  const template = templates.find(t => t.value === contract.template) || templates[0];
                  const Icon = template.icon;
                  return (
                    <motion.button
                      key={contract.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedContract(contract)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all mb-1",
                        selectedContract?.id === contract.id
                          ? "bg-green-50 border border-green-200"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        template.color
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{contract.name}</p>
                        <p className="text-xs text-gray-500">{template.label}</p>
                      </div>
                      {contract.verified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                      <ChevronRight className={cn(
                        "w-4 h-4 text-gray-400 transition-transform",
                        selectedContract?.id === contract.id && "rotate-90"
                      )} />
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Contract Editor */}
      <div className="flex-1 bg-gray-50/50 flex flex-col">
        {selectedContract ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    currentTemplate.color
                  )}>
                    <currentTemplate.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-semibold">{selectedContract.name}</h1>
                      {selectedContract.verified && (
                        <Badge className="bg-blue-100 text-blue-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {selectedContract.status === 'deployed' && (
                        <Badge className="bg-green-100 text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Deployed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <NetworkBadge network={selectedContract.network} size="sm" />
                      <Badge variant="outline" className="text-xs">{currentTemplate.label}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <WalletConnect 
                    wallet={wallet} 
                    onConnect={setWallet} 
                    onDisconnect={() => setWallet(null)} 
                  />
                  <Button
                    onClick={handleCompile}
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Compile
                  </Button>
                  <Button
                    onClick={() => updateMutation.mutate({ id: selectedContract.id, data: selectedContract })}
                    variant="outline"
                    className="rounded-xl"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={handleDeploy}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl"
                    disabled={selectedContract.status === 'deployed'}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    {selectedContract.status === 'deployed' ? 'Deployed' : 'Deploy'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="bg-white border-b border-gray-100 px-4">
                <TabsList className="h-12 bg-transparent p-0 gap-4">
                  <TabsTrigger value="code" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none px-0">
                    <Code className="w-4 h-4 mr-2" />
                    Source Code
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none px-0">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="code" className="flex-1 m-0 p-0">
                <div className="h-full bg-[#1e1e1e]">
                  <Textarea
                    value={selectedContract.source_code || ''}
                    onChange={(e) => setSelectedContract({ ...selectedContract, source_code: e.target.value })}
                    className="w-full h-full font-mono text-sm bg-transparent text-gray-200 border-0 rounded-none resize-none focus-visible:ring-0 p-4"
                    placeholder="// Write your Solidity code here..."
                    spellCheck={false}
                  />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="flex-1 m-0 p-6 overflow-auto">
                <div className="max-w-2xl space-y-6">
                  <Card className="rounded-2xl">
                    <CardHeader>
                      <CardTitle>Contract Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Name</Label>
                        <Input
                          value={selectedContract.name}
                          onChange={(e) => setSelectedContract({ ...selectedContract, name: e.target.value })}
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Description</Label>
                        <Textarea
                          value={selectedContract.description || ''}
                          onChange={(e) => setSelectedContract({ ...selectedContract, description: e.target.value })}
                          className="rounded-xl resize-none h-24"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600 mb-1.5 block">Network</Label>
                        <Select 
                          value={selectedContract.network} 
                          onValueChange={(v) => setSelectedContract({ ...selectedContract, network: v })}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {networks.map((network) => (
                              <SelectItem key={network.value} value={network.value}>
                                <span className="flex items-center gap-2">
                                  <span>{network.icon}</span>
                                  <span>{network.label}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {selectedContract.contract_address && (
                    <Card className="rounded-2xl">
                      <CardHeader>
                        <CardTitle>Deployment Info</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div>
                          <Label className="text-sm text-gray-600 mb-1.5 block">Contract Address</Label>
                          <Input
                            value={selectedContract.contract_address}
                            readOnly
                            className="h-11 rounded-xl font-mono bg-gray-50"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={FileCode}
              title="Select or create a contract"
              description="Choose a contract from the sidebar to edit, or create a new one from a template."
              actionLabel="Create Contract"
              onAction={() => setShowNewDialog(true)}
            />
          </div>
        )}
      </div>

      {/* Deployment Modal */}
      <DeploymentModal
        open={showDeployModal}
        onOpenChange={setShowDeployModal}
        contract={selectedContract}
        wallet={wallet}
        onDeploymentComplete={handleDeploymentComplete}
        onConnectWallet={() => {}}
      />

      {/* New Contract Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create Smart Contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Choose a Template</Label>
              <div className="grid grid-cols-4 gap-2">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.value}
                      onClick={() => setNewContract({ ...newContract, template: template.value })}
                      className={cn(
                        "p-3 rounded-xl border text-center transition-all",
                        newContract.template === template.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg bg-gradient-to-br mx-auto mb-2 flex items-center justify-center",
                        template.color
                      )}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-sm block">{template.label}</span>
                      <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Contract Name</Label>
                <Input
                  value={newContract.name}
                  onChange={(e) => setNewContract({ ...newContract, name: e.target.value })}
                  placeholder="MyContract"
                  className="h-11 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1.5 block">Network</Label>
                <Select value={newContract.network} onValueChange={(v) => setNewContract({ ...newContract, network: v })}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => (
                      <SelectItem key={network.value} value={network.value}>
                        <span className="flex items-center gap-2">
                          <span>{network.icon}</span>
                          <span>{network.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-1.5 block">Description</Label>
              <Textarea
                value={newContract.description}
                onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                placeholder="What does this contract do?"
                className="rounded-xl resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate({ 
                ...newContract, 
                project_id: projectId, 
                status: 'draft',
                source_code: getTemplateCode(newContract.template)
              })}
              disabled={!newContract.name || createMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}