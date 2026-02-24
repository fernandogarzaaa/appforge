#!/usr/bin/env python3
"""
Vast.ai Cheapest GPU Finder
Automatically find and rent the cheapest available GPUs
"""

import os
import json
import asyncio
import aiohttp
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class VastOffer:
    id: str
    machine_id: int
    gpu_name: str
    gpu_count: int
    vram_gb: float
    price_per_hour: float
    dlperf: float  # Deep learning performance score
    reliability: float
    inet_up: float  # Upload speed
    inet_down: float  # Download speed
    cuda_max_good: float
    host_id: str
    verification: str
    direct_port_count: int

class VastAICheapestFinder:
    """Find and rent cheapest GPUs on Vast.ai"""
    
    API_BASE = "https://console.vast.ai/api/v0"
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('VAST_API_KEY')
        
    async def search_offers(
        self,
        min_vram_gb: float = 16,
        max_price: float = 0.50,
        min_dlperf: float = 1000,
        gpu_names: Optional[List[str]] = None,
        order_by: str = "dph_total",  # Price per hour
        order: str = "asc"
    ) -> List[VastOffer]:
        """Search for cheapest GPU offers"""
        print(f"🔍 Searching Vast.ai for cheapest GPUs...")
        
        query = {
            "q": {
                "gpu_ram": {"gte": min_vram_gb * 1024},  # MB
                "dph_total": {"lte": max_price},
                "dlperf": {"gte": min_dlperf},
                "verified": {"eq": True},
                "external": {"eq": False},
                "rentable": {"eq": True},
                "cuda_max_good": {"gte": 11.8}
            },
            "order": [[order_by, order]],
            "type": "ask"
        }
        
        if gpu_names:
            query["q"]["gpu_name"] = {"in": gpu_names}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.API_BASE}/bundles",
                json=query,
                headers={"Accept": "application/json"}
            ) as response:
                data = await response.json()
                
                if not data.get('offers'):
                    print("⚠️ No offers found matching criteria")
                    return []
                
                offers = []
                for offer_data in data['offers']:
                    offer = VastOffer(
                        id=str(offer_data.get('id', '')),
                        machine_id=offer_data.get('machine_id', 0),
                        gpu_name=offer_data.get('gpu_name', 'Unknown'),
                        gpu_count=offer_data.get('num_gpus', 1),
                        vram_gb=offer_data.get('gpu_ram', 0) / 1024,
                        price_per_hour=offer_data.get('dph_total', 0),
                        dlperf=offer_data.get('dlperf', 0),
                        reliability=offer_data.get('reliability2', 0),
                        inet_up=offer_data.get('inet_up', 0),
                        inet_down=offer_data.get('inet_down', 0),
                        cuda_max_good=offer_data.get('cuda_max_good', 0),
                        host_id=str(offer_data.get('host_id', '')),
                        verification=offer_data.get('verification', ''),
                        direct_port_count=offer_data.get('direct_port_count', 0)
                    )
                    offers.append(offer)
                
                print(f"✅ Found {len(offers)} offers")
                return offers
    
    def print_offer_table(self, offers: List[VastOffer], limit: int = 10):
        """Print offers in a formatted table"""
        print("\n" + "=" * 120)
        print(f"{'Rank':<6}{'GPU':<20}{'VRAM':<10}{'$/hr':<10}{'DLPerf':<12}{'Reliability':<12}{'Upload':<10}{'ID':<15}")
        print("=" * 120)
        
        for i, offer in enumerate(offers[:limit], 1):
            print(f"{i:<6}{offer.gpu_name:<20}{offer.vram_gb:.1f}GB{'':<4}"
                  f"${offer.price_per_hour:.3f}{'':<6}{offer.dlperf:<12.0f}"
                  f"{offer.reliability*100:.0f}%{'':<7}{offer.inet_up:.1f}MB/s{'':<3}{offer.id:<15}")
        
        print("=" * 120)
    
    async def rent_instance(
        self,
        offer_id: str,
        image: str = "pytorch/pytorch:2.1.0-cuda11.8-cudnn8-runtime",
        disk_size_gb: int = 50,
        env: Optional[Dict[str, str]] = None,
        onstart: Optional[str] = None
    ) -> Optional[Dict]:
        """Rent a specific instance"""
        if not self.api_key:
            raise ValueError("API key required for renting")
        
        print(f"🚀 Renting instance {offer_id}...")
        
        payload = {
            "client_id": "me",
            "image": image,
            "env": env or {},
            "disk": disk_size_gb,
            "onstart": onstart or "",
            "runtype": "ssh",  # or "jupyter" for notebook
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.put(
                f"{self.API_BASE}/asks/{offer_id}/",
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            ) as response:
                data = await response.json()
                
                if data.get('success'):
                    instance = data.get('new_contract', {})
                    print(f"✅ Instance rented successfully!")
                    print(f"   ID: {instance.get('id')}")
                    print(f"   Cost: ${instance.get('rate', 0):.3f}/hr")
                    return instance
                else:
                    print(f"❌ Failed to rent: {data.get('error', 'Unknown error')}")
                    return None
    
    async def get_instances(self) -> List[Dict]:
        """List your current instances"""
        if not self.api_key:
            raise ValueError("API key required")
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.API_BASE}/instances",
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                data = await response.json()
                return data.get('instances', [])
    
    async def destroy_instance(self, instance_id: str) -> bool:
        """Destroy/terminate an instance"""
        if not self.api_key:
            raise ValueError("API key required")
        
        print(f"🗑️ Destroying instance {instance_id}...")
        
        async with aiohttp.ClientSession() as session:
            async with session.delete(
                f"{self.API_BASE}/instances/{instance_id}/",
                headers={"Authorization": f"Bearer {self.api_key}"}
            ) as response:
                if response.status == 200:
                    print(f"✅ Instance {instance_id} destroyed")
                    return True
                else:
                    print(f"❌ Failed to destroy instance")
                    return False
    
    async def auto_select_and_rent(
        self,
        min_vram_gb: float = 16,
        max_price: float = 0.50,
        preferred_gpus: Optional[List[str]] = None,
        training_script: Optional[str] = None
    ) -> Optional[Dict]:
        """Automatically find and rent the best value GPU"""
        
        # Search for offers
        offers = await self.search_offers(
            min_vram_gb=min_vram_gb,
            max_price=max_price,
            gpu_names=preferred_gpus
        )
        
        if not offers:
            return None
        
        # Score offers by value (dlperf / price)
        scored_offers = [
            (offer, offer.dlperf / offer.price_per_hour)
            for offer in offers
            if offer.reliability > 0.8  # Filter low reliability
        ]
        
        scored_offers.sort(key=lambda x: x[1], reverse=True)
        
        # Display top options
        self.print_offer_table([o[0] for o in scored_offers], limit=5)
        
        # Try to rent best option
        for offer, score in scored_offers[:3]:
            print(f"\n💎 Best value: {offer.gpu_name} at ${offer.price_per_hour:.3f}/hr "
                  f"(Score: {score:.0f}, Reliability: {offer.reliability*100:.0f}%)")
            
            # Prepare startup script
            onstart = None
            if training_script:
                onstart = f"""#!/bin/bash
cd /workspace
apt-get update && apt-get install -y git wget
pip install torch transformers accelerate peft bitsandbytes trl datasets
{training_script}
"""
            
            instance = await self.rent_instance(
                offer_id=offer.id,
                onstart=onstart,
                env={
                    'VAST_INSTANCE_ID': offer.id,
                    'TRAINING_START_TIME': datetime.now().isoformat()
                }
            )
            
            if instance:
                return instance
        
        return None

class VastTrainingOrchestrator:
    """Orchestrate training across multiple Vast.ai instances"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.finder = VastAICheapestFinder(api_key)
        self.instances: List[Dict] = []
        self.checkpoint_sync = CheckpointSync()
    
    async def start_distributed_training(
        self,
        num_instances: int = 2,
        min_vram_gb: float = 16,
        max_price: float = 0.50
    ):
        """Start training on multiple cheap instances"""
        print(f"🚀 Starting distributed training on {num_instances} instances...")
        
        for i in range(num_instances):
            print(f"\n--- Instance {i+1}/{num_instances} ---")
            
            instance = await self.finder.auto_select_and_rent(
                min_vram_gb=min_vram_gb,
                max_price=max_price,
                training_script=f"train_worker.py --rank {i} --world-size {num_instances}"
            )
            
            if instance:
                self.instances.append(instance)
            else:
                print(f"⚠️ Failed to rent instance {i+1}")
        
        print(f"\n✅ Successfully rented {len(self.instances)}/{num_instances} instances")
        
        # Display connection info
        for i, instance in enumerate(self.instances):
            print(f"\nInstance {i+1}:")
            print(f"  SSH: ssh -p {instance.get('ssh_port')} root@{instance.get('ssh_host')}")
            print(f"  Cost: ${instance.get('rate', 0):.3f}/hr")
    
    async def monitor_costs(self):
        """Monitor total training costs"""
        total_hourly = sum(
            inst.get('rate', 0)
            for inst in self.instances
        )
        
        print(f"\n💰 Cost Monitoring:")
        print(f"   Hourly: ${total_hourly:.3f}")
        print(f"   Daily: ${total_hourly * 24:.2f}")
        print(f"   Weekly: ${total_hourly * 24 * 7:.2f}")
    
    async def cleanup(self):
        """Destroy all instances"""
        print("\n🧹 Cleaning up instances...")
        
        for instance in self.instances:
            await self.finder.destroy_instance(instance['id'])
        
        self.instances = []
        print("✅ All instances destroyed")

class CheckpointSync:
    """Sync checkpoints between instances"""
    
    def __init__(self, s3_bucket: Optional[str] = None):
        self.s3_bucket = s3_bucket or os.getenv('CHECKPOINT_BUCKET', 's3://superior-llm-checkpoints')
    
    def get_sync_command(self) -> str:
        """Get command to sync checkpoints"""
        return f"""
# Sync checkpoints to S3
aws s3 sync /workspace/checkpoints {self.s3_bucket}/$(date +%Y%m%d_%H%M%S)/

# Or use rsync for local sync
rsync -avz /workspace/checkpoints/ user@backup-server:/backups/
"""

async def main():
    """Main Vast.ai workflow"""
    print("=" * 60)
    print("Superior Free LLM - Vast.ai Cheapest GPU Finder")
    print("=" * 60)
    
    finder = VastAICheapestFinder()
    
    # Just search (no API key needed)
    print("\n1. Searching for available GPUs...")
    offers = await finder.search_offers(
        min_vram_gb=16,
        max_price=0.50
    )
    
    if offers:
        finder.print_offer_table(offers, limit=10)
        
        # If API key available, offer to rent
        if os.getenv('VAST_API_KEY'):
            print("\n2. Auto-renting best value instance...")
            instance = await finder.auto_select_and_rent(
                min_vram_gb=16,
                max_price=0.50
            )
            
            if instance:
                print(f"\n✅ Training instance ready!")
                print(f"Connect with: ssh -p {instance.get('ssh_port')} root@{instance.get('ssh_host')}")
        else:
            print("\n💡 Set VAST_API_KEY to enable auto-renting")

if __name__ == "__main__":
    asyncio.run(main())
