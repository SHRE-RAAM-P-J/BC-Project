import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  Hash, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Copy, 
  Check, 
  Info,
  ShieldCheck,
  Zap,
  Activity,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { blockchainService } from '../services/blockchain';
import { batchService } from '../services/mockData';
import { shortenAddress } from '../lib/utils';
import { useToast } from '../components/Toast';

export const BlockchainExplorer: React.FC = () => {
  const { addToast } = useToast();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveChain, setIsLiveChain] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{
    latestBlock: number;
    chainId: number;
    gasPrice: string;
    totalTransactions: number;
  }>({
    latestBlock: 19485250,
    chainId: 31337,
    gasPrice: '18.4 Gwei',
    totalTransactions: 6,
  });

  const [recentBlocks, setRecentBlocks] = useState<any[]>([]);
  const [onChainTxList, setOnChainTxList] = useState<any[]>([]);

  const contractAddress = blockchainService.getContractAddress();

  const loadBlockchainData = async () => {
    setIsLoading(true);
    try {
      const conn = await blockchainService.validateConnection();
      if (conn.connected && conn.contractDeployed) {
        setIsLiveChain(true);
        const provider = blockchainService.getProvider();
        const blockNum = conn.latestBlock || 0;

        // Fetch recent real blocks from local node down to block 0
        const blocksCount = Math.min(blockNum + 1, 6);
        const blockPromises = [];
        for (let i = 0; i < blocksCount; i++) {
          const targetBlock = blockNum - i;
          if (targetBlock >= 0) {
            blockPromises.push(provider.getBlock(targetBlock));
          }
        }
        const blocksData = await Promise.all(blockPromises);

        const formattedBlocks = blocksData.filter(Boolean).map((b: any) => ({
          blockNumber: b.number,
          hash: b.hash,
          miner: b.miner || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          transactionsCount: b.transactions.length,
          timestamp: new Date(Number(b.timestamp) * 1000).toUTCString(),
          gasUsed: b.gasUsed.toString(),
        }));

        setRecentBlocks(formattedBlocks);

        // Fetch on-chain event logs
        const { registrations, transfers, statusUpdates } = await blockchainService.getOnChainEvents();

        const combinedEvents: any[] = [
          ...registrations.map((r) => ({
            id: `reg-${r.txHash}`,
            type: 'Batch Registered (Genesis)',
            batchId: r.batchId,
            from: '0x0000000000000000000000000000000000000000',
            to: r.manufacturer,
            blockNumber: r.blockNumber,
            txHash: r.txHash,
          })),
          ...transfers.map((t) => ({
            id: `tr-${t.txHash}`,
            type: 'Custody Handover',
            batchId: t.batchId,
            from: t.from,
            to: t.to,
            blockNumber: t.blockNumber,
            txHash: t.txHash,
          })),
          ...(statusUpdates || []).map((s) => ({
            id: `status-${s.txHash}`,
            type: `Status: New State (${s.newStatus})`,
            batchId: s.batchId,
            from: 'Authorized Custodian',
            to: s.reason || 'Status Transition',
            blockNumber: s.blockNumber,
            txHash: s.txHash,
          })),
        ].sort((a, b) => b.blockNumber - a.blockNumber);

        setOnChainTxList(combinedEvents);

        const feeData = await provider.getFeeData();
        const gasPriceGwei = feeData.gasPrice
          ? `${(Number(feeData.gasPrice) / 1e9).toFixed(1)} Gwei`
          : '0.0 Gwei';

        setNetworkInfo({
          latestBlock: blockNum,
          chainId: conn.chainId || 31337,
          gasPrice: gasPriceGwei,
          totalTransactions: combinedEvents.length,
        });

        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Error reading live blockchain explorer data:', err);
    }

    // Fallback to demo snapshot
    setIsLiveChain(false);
    setRecentBlocks(batchService.getBlocks());
    const mockTransfers = batchService.getBatches().flatMap((b) =>
      b.transfers.map((t) => ({
        id: t.id,
        type: t.fromAddress === '0x0000000000000000000000000000000000000000'
          ? 'Batch Registered (Genesis)'
          : 'Custody Handover',
        batchId: b.id,
        from: t.fromAddress,
        to: t.toAddress,
        blockNumber: t.blockNumber,
        txHash: t.txHash,
      }))
    );
    setOnChainTxList(mockTransfers.slice(0, 6));
    setIsLoading(false);
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    addToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
              Blockchain Explorer
            </h1>
            {isLiveChain ? (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                Hardhat Node #31337 Live
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold font-mono">
                Historical Demo Snapshot
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit of smart contract ledger, mined blocks & cryptographic transactions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadBlockchainData}
            className="p-2 text-slate-400 hover:text-white bg-navy-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
            title="Refresh blockchain explorer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Contract Address Pill */}
          <div className="p-2.5 rounded-xl bg-navy-900 border border-slate-800 flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-brand-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                MediChain.sol Contract
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs text-white">
                <span>{shortenAddress(contractAddress, 6)}</span>
                <button
                  onClick={() => copyText(contractAddress)}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedHash === contractAddress ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Offline Alert if disconnected */}
      {!isLiveChain && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Standalone Hardhat node is offline. Displaying demo historical blocks and event audits.</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/60">
            Offline Mode
          </span>
        </div>
      )}

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">Latest Mined Block</span>
          <span className="text-2xl font-bold text-white font-mono">
            #{networkInfo.latestBlock.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-400 block mt-1">Confirmed on-chain</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">Network Chain ID</span>
          <span className="text-2xl font-bold text-brand-300 font-mono">
            {networkInfo.chainId}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Hardhat EVM Local</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">Current Gas Price</span>
          <span className="text-2xl font-bold text-sky-300 font-mono">
            {networkInfo.gasPrice}
          </span>
          <span className="text-[11px] text-sky-400 block mt-1">Near-zero local cost</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-900/80 border border-slate-800/80">
          <span className="text-xs text-slate-400 block mb-1">Total On-Chain Logs</span>
          <span className="text-2xl font-bold text-purple-300 font-mono">
            {networkInfo.totalTransactions}
          </span>
          <span className="text-[11px] text-purple-400 block mt-1">Indexed event logs</span>
        </div>
      </div>

      {/* Explorer Split: Recent Blocks & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocks Column */}
        <div className="rounded-xl bg-navy-900/80 border border-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Recent Mined Blocks</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {isLiveChain ? 'Live EVM' : 'Historical Data'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {recentBlocks.map((block) => (
              <div
                key={block.blockNumber}
                className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-navy-950 text-brand-400 border border-slate-800 font-mono font-semibold">
                    Bk
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-mono font-semibold text-white">
                      <span>#{block.blockNumber}</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        ({block.transactionsCount} txns)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>Miner: {shortenAddress(block.miner, 4)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono text-[11px] text-slate-400 truncate max-w-[130px]">
                    {shortenAddress(block.hash, 5)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Gas: {block.gasUsed}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions Column */}
        <div className="rounded-xl bg-navy-900/80 border border-slate-800/80 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Smart Contract Transactions</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {isLiveChain ? 'Contract Filter' : 'Demo Logs'}
            </span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {onChainTxList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">
                No contract transactions recorded in current block window.
              </div>
            ) : (
              onChainTxList.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-navy-950 text-sky-400 border border-slate-800 font-mono font-semibold shrink-0">
                      Tx
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white truncate">{tx.type}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-brand-300 shrink-0">
                          {tx.batchId}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                        From {shortenAddress(tx.from, 4)} → To {shortenAddress(tx.to, 4)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-[11px] text-brand-400">
                      {shortenAddress(tx.txHash, 4)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Bk #{tx.blockNumber}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
