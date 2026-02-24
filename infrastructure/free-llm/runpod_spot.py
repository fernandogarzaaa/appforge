#!/usr/bin/env python3
"""
RunPod Spot Instance Automation
Find and auto-restart training on cheap spot instances
"""

import os
import json
import time
import asyncio
import aiohttp
from typing import List, Dict, Optional
from dataclasses import dataclass

@dataclass
class SpotInstance:
    id: str
    gpu_type: str
    gpu_count: int
    price_per_hour: float
    location: str
    availability: str

class RunPodSpotManager:
    """Manage RunPod spot instances for cost-effective training"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv('RUNPOD_API_KEY')
        self.api_url = "https://api.runpod.io/v2"
        self.graphql_url = "https://api.runpod.io/graphql"
        
        if not self.api_key:
            raise ValueError("RunPod API key required")
    
    async def list_gpu_types(self) -> List[Dict]:
        """List all available GPU types and their spot prices"""
        query = """
        query GpuTypes {
            gpuTypes {
                id
                displayName
                memoryInGb
                securePrice
                communityPrice
            }
        }
        """
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.graphql_url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"query": query}
            ) as response:
                data = await response.json()
                return data['data']['gpuTypes']
    
    async def find_cheapest_spot(
        self,
        min_vram_gb: int = 16,
        max_price: float = 0.50
    ) -> Optional[SpotInstance]:
        """Find the cheapest available spot instance"""
        print(f"🔍 Searching for cheapest spot instance (min {min_vram_gb}GB VRAM)...")
        
        gpu_types = await self.list_gpu_types()
        
        candidates = []
        for gpu in gpu_types:
            memory = gpu.get('memoryInGb', 0)
            price = gpu.get('communityPrice', 999)
            
            if memory >= min_vram_gb and price <= max_price:
                candidates.append({
                    'id': gpu['id'],
                    'name': gpu['displayName'],
                    'memory': memory,
                    'price': price
                })
        
        if not candidates:
            print("⚠️ No suitable spot instances found")
            return None
        
        # Sort by price
        candidates.sort(key=lambda x: x['price'])
        cheapest = candidates[0]
        
        print(f"✅ Found: {cheapest['name']} - ${cheapest['price']:.3f}/hr")
        
        return SpotInstance(
            id=cheapest['id'],
            gpu_type=cheapest['name'],
            gpu_count=1,
            price_per_hour=cheapest['price'],
            location="any",
            availability="available"
        )
    
    async def create_spot_pod(
        self,
        gpu_type_id: str,
        image_name: str = "runpod/pytorch:2.1.0-py3.10-cuda11.8-devel-ubuntu22.04",
        container_disk_size_gb: int = 50,
        volume_size_gb: int = 100,
        env_vars: Optional[Dict[str, str]] = None
    ) -> Optional[str]:
        """Create a spot instance pod"""
        print(f"🚀 Creating spot pod with {gpu_type_id}...")
        
        mutation = """
        mutation PodFindAndDeployOnDemand($input: PodFindAndDeployOnDemandInput!) {
            podFindAndDeployOnDemand(input: $input) {
                id
                imageName
                env
                machineId
                machine {
                    podHostId
                }
            }
        }
        """
        
        variables = {
            "input": {
                "cloudType": "COMMUNITY",  # Spot instance
                "gpuCount": 1,
                "volumeInGb": volume_size_gb,
                "containerDiskInGb": container_disk_size_gb,
                "minVcpuCount": 4,
                "minMemoryInGb": 16,
                "gpuTypeId": gpu_type_id,
                "name": f"superior-llm-spot-{int(time.time())}",
                "imageName": image_name,
                "dockerArgs": "",
                "ports": "22/tcp,8888/http,8000/http",
                "volumeMountPath": "/workspace",
                "env": [
                    {"key": k, "value": v}
                    for k, v in (env_vars or {}).items()
                ]
            }
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.graphql_url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"query": mutation, "variables": variables}
            ) as response:
                data = await response.json()
                
                if 'errors' in data:
                    print(f"❌ Error: {data['errors']}")
                    return None
                
                pod_id = data['data']['podFindAndDeployOnDemand']['id']
                host_id = data['data']['podFindAndDeployOnDemand']['machine']['podHostId']
                
                print(f"✅ Spot pod created: {pod_id}")
                print(f"   Host: {host_id}")
                
                return pod_id
    
    async def get_pod_status(self, pod_id: str) -> Optional[Dict]:
        """Get pod status and details"""
        query = """
        query Pod($id: String!) {
            pod(id: $id) {
                id
                name
                runtime {
                    uptimeInSeconds
                    ports {
                        ip
                        isIpPublic
                        privatePort
                        publicPort
                        type
                    }
                }
                machine {
                    gpuDisplayName
                }
            }
        }
        """
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.graphql_url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"query": query, "variables": {"id": pod_id}}
            ) as response:
                data = await response.json()
                return data.get('data', {}).get('pod')
    
    async def terminate_pod(self, pod_id: str) -> bool:
        """Terminate a pod"""
        mutation = """
        mutation PodTerminate($input: PodTerminateInput!) {
            podTerminate(input: $input)
        }
        """
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.graphql_url,
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "query": mutation,
                    "variables": {"input": {"podId": pod_id}}
                }
            ) as response:
                data = await response.json()
                success = data.get('data', {}).get('podTerminate', False)
                
                if success:
                    print(f"✅ Pod {pod_id} terminated")
                else:
                    print(f"❌ Failed to terminate pod {pod_id}")
                
                return success
    
    async def wait_for_pod_ready(
        self,
        pod_id: str,
        timeout_seconds: int = 300
    ) -> bool:
        """Wait for pod to be ready"""
        print(f"⏳ Waiting for pod {pod_id} to be ready...")
        
        start_time = time.time()
        while time.time() - start_time < timeout_seconds:
            status = await self.get_pod_status(pod_id)
            
            if status and status.get('runtime'):
                uptime = status['runtime'].get('uptimeInSeconds', 0)
                if uptime > 0:
                    print(f"✅ Pod ready! Uptime: {uptime}s")
                    return True
            
            await asyncio.sleep(10)
        
        print("❌ Timeout waiting for pod")
        return False

class SpotTrainingManager:
    """Manage training with automatic spot instance recovery"""
    
    def __init__(self, runpod_manager: RunPodSpotManager):
        self.runpod = runpod_manager
        self.current_pod: Optional[str] = None
        self.checkpoint_bucket = os.getenv('CHECKPOINT_BUCKET', 's3://superior-llm-checkpoints')
    
    async def start_training_session(
        self,
        training_script: str,
        min_vram_gb: int = 24,
        max_price: float = 0.60
    ):
        """Start a training session on spot instance"""
        print("=" * 50)
        print("Superior Free LLM - Spot Instance Training")
        print("=" * 50)
        
        # Find cheapest spot
        spot = await self.runpod.find_cheapest_spot(min_vram_gb, max_price)
        
        if not spot:
            print("❌ No suitable spot instances available")
            return
        
        # Create pod
        pod_id = await self.runpod.create_spot_pod(
            gpu_type_id=spot.id,
            env_vars={
                'TRAINING_SCRIPT': training_script,
                'CHECKPOINT_BUCKET': self.checkpoint_bucket,
                'RESUME_TRAINING': 'true'
            }
        )
        
        if not pod_id:
            return
        
        self.current_pod = pod_id
        
        # Wait for ready
        ready = await self.runpod.wait_for_pod_ready(pod_id)
        
        if ready:
            status = await self.runpod.get_pod_status(pod_id)
            print(f"\n🎉 Training pod ready!")
            print(f"   SSH access: ssh root@{status['runtime']['ports'][0]['ip']}")
            print(f"   Jupyter: http://{status['runtime']['ports'][1]['ip']}:{status['runtime']['ports'][1]['publicPort']}")
        
        return pod_id
    
    async def monitor_and_recover(self, check_interval: int = 60):
        """Monitor training and recover from spot interruptions"""
        print("🔍 Starting spot instance monitor...")
        
        while True:
            if self.current_pod:
                status = await self.runpod.get_pod_status(self.current_pod)
                
                if not status:
                    print("⚠️ Pod lost! Attempting recovery...")
                    await self.recover_training()
                else:
                    uptime = status.get('runtime', {}).get('uptimeInSeconds', 0)
                    print(f"✅ Pod healthy - Uptime: {uptime}s")
            
            await asyncio.sleep(check_interval)
    
    async def recover_training(self):
        """Recover training on new spot instance"""
        print("🔄 Recovering training session...")
        
        # Terminate old pod if exists
        if self.current_pod:
            await self.runpod.terminate_pod(self.current_pod)
        
        # Start new session
        await self.start_training_session(
            training_script=os.getenv('TRAINING_SCRIPT', 'train.py')
        )

def main():
    """Main RunPod spot instance workflow"""
    api_key = os.getenv('RUNPOD_API_KEY')
    
    if not api_key:
        print("❌ Set RUNPOD_API_KEY environment variable")
        return
    
    runpod = RunPodSpotManager(api_key)
    manager = SpotTrainingManager(runpod)
    
    # Run async
    asyncio.run(manager.start_training_session(
        training_script="train.py",
        min_vram_gb=24,
        max_price=0.60
    ))

if __name__ == "__main__":
    main()
