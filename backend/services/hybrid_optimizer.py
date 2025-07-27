"""
Hybrid Route Optimizer
Combines custom algorithm with Google Cloud Route Optimization API
Falls back gracefully when API is unavailable
"""

import logging
from typing import List, Dict, Optional

# Try to import Google Cloud optimizer, fallback if not available
try:
    from .google_cloud_optimizer import GoogleCloudRouteOptimizer
    GOOGLE_CLOUD_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ Google Cloud optimizer not available: {e}")
    GoogleCloudRouteOptimizer = None
    GOOGLE_CLOUD_AVAILABLE = False

from .route_optimizer import RouteOptimizer

logger = logging.getLogger(__name__)

class HybridRouteOptimizer:
    """
    Hybrid route optimizer that combines:
    1. Google Cloud Route Optimization API (primary)
    2. Custom algorithm (fallback)
    """
    
    def __init__(self, google_project_id: str = None, google_credentials_path: str = None):
        """Initialize hybrid optimizer"""
        
        # Initialize optimizers
        if GOOGLE_CLOUD_AVAILABLE:
            try:
                self.google_optimizer = GoogleCloudRouteOptimizer(google_project_id, google_credentials_path)
            except Exception as e:
                print(f"⚠️ Failed to initialize Google Cloud optimizer: {e}")
                self.google_optimizer = None
        else:
            self.google_optimizer = None
            
        self.custom_optimizer = RouteOptimizer()
        
        # Configuration
        self.prefer_google_cloud = True and (self.google_optimizer is not None)
        self.max_packages_for_google = 100  # Limit for cost control
        self.comparison_mode = False  # Set to True to compare both algorithms
        
        logger.info("🔧 Hybrid Route Optimizer initialized")
        logger.info(f"   - Google Cloud API: {'✅ Available' if self.google_optimizer and self.google_optimizer.is_available() else '❌ Not available'}")
        logger.info(f"   - Custom Algorithm: ✅ Available")
    
    def optimize_route(self, packages: List[Dict], depot_location: Dict = None, force_algorithm: str = None) -> Dict:
        """
        Optimize route using hybrid approach
        
        Args:
            packages: List of package dictionaries
            depot_location: Starting depot location
            force_algorithm: Force specific algorithm ('google' or 'custom')
            
        Returns:
            Optimized route result with algorithm metadata
        """
        
        # Determine which algorithm to use
        algorithm_to_use = self._select_algorithm(packages, force_algorithm)
        
        logger.info(f"🎯 Using {algorithm_to_use} algorithm for {len(packages)} packages")
        
        try:
            if algorithm_to_use == 'google':
                result = self._optimize_with_google(packages, depot_location)
            else:
                result = self._optimize_with_custom(packages, depot_location)
            
            # Add hybrid metadata
            result['hybrid_metadata'] = {
                'algorithm_used': algorithm_to_use,
                'google_cloud_available': self.google_optimizer.is_available(),
                'package_count': len(packages),
                'optimization_timestamp': str(datetime.now()),
                'fallback_reason': getattr(self, '_fallback_reason', None)
            }
            
            # Optional: Compare algorithms if in comparison mode
            if self.comparison_mode and len(packages) <= 20:
                comparison_result = self._compare_algorithms(packages, depot_location)
                result['algorithm_comparison'] = comparison_result
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Hybrid optimization failed: {e}")
            
            # Emergency fallback to custom algorithm
            if algorithm_to_use == 'google':
                logger.warning("🔄 Falling back to custom algorithm due to Google Cloud error")
                self._fallback_reason = f"Google Cloud error: {str(e)}"
                return self._optimize_with_custom(packages, depot_location)
            else:
                raise
    
    def _select_algorithm(self, packages: List[Dict], force_algorithm: str = None) -> str:
        """Select which algorithm to use based on conditions"""
        
        # Force specific algorithm if requested
        if force_algorithm:
            if force_algorithm == 'google' and (not self.google_optimizer or not self.google_optimizer.is_available()):
                logger.warning("⚠️ Google Cloud forced but not available, using custom")
                self._fallback_reason = "Google Cloud forced but not available"
                return 'custom'
            return force_algorithm
        
        # Check if Google Cloud is available
        if not self.google_optimizer or not self.google_optimizer.is_available():
            self._fallback_reason = "Google Cloud API not available"
            return 'custom'
        
        # Check package count limit for cost control
        if len(packages) > self.max_packages_for_google:
            self._fallback_reason = f"Package count ({len(packages)}) exceeds Google Cloud limit ({self.max_packages_for_google})"
            logger.info(f"📊 Using custom algorithm: {len(packages)} packages > {self.max_packages_for_google} limit")
            return 'custom'
        
        # Use Google Cloud by default
        if self.prefer_google_cloud:
            return 'google'
        else:
            return 'custom'
    
    def _optimize_with_google(self, packages: List[Dict], depot_location: Dict) -> Dict:
        """Optimize using Google Cloud Route Optimization API"""
        
        try:
            result = self.google_optimizer.optimize_route(packages, depot_location)
            
            # Enhance result with additional metadata
            result['algorithm_details'] = {
                'name': 'Google Cloud Route Optimization',
                'version': 'Production API',
                'features': ['Real-time traffic', 'Vehicle constraints', 'Time windows', 'Multi-objective optimization'],
                'accuracy': 'Professional grade',
                'cost_per_request': 'Variable based on complexity'
            }
            
            logger.info(f"✅ Google Cloud optimization: {result['total_distance_km']:.1f}km, {result['total_duration_minutes']:.0f}min")
            return result
            
        except Exception as e:
            logger.error(f"❌ Google Cloud optimization failed: {e}")
            raise
    
    def _optimize_with_custom(self, packages: List[Dict], depot_location: Dict = None) -> Dict:
        """Optimize using custom algorithm"""
        
        try:
            # Use existing custom optimizer
            result = self.custom_optimizer.optimize_route(packages)
            
            # Convert to hybrid format
            hybrid_result = {
                'optimized_stops': result['optimized_route'],
                'total_distance_km': result['total_distance_km'],
                'total_duration_minutes': result.get('total_duration_minutes', result['total_distance_km'] * 2),  # Estimate
                'optimization_score': result.get('optimization_score', 0),
                'api_used': 'custom_hybrid',
                'depot_location': depot_location or {
                    'latitude': 41.0082,
                    'longitude': 28.9784,
                    'address': 'Istanbul Merkez Depo'
                },
                'algorithm_details': {
                    'name': 'Custom Hybrid Algorithm',
                    'version': '2.0',
                    'features': ['Geographic clustering', 'Priority weighting', 'Distance optimization', 'Delivery type handling'],
                    'accuracy': 'Good for medium-scale routing',
                    'cost_per_request': 'Free'
                }
            }
            
            logger.info(f"✅ Custom optimization: {hybrid_result['total_distance_km']:.1f}km, {hybrid_result['total_duration_minutes']:.0f}min")
            return hybrid_result
            
        except Exception as e:
            logger.error(f"❌ Custom optimization failed: {e}")
            raise
    
    def _compare_algorithms(self, packages: List[Dict], depot_location: Dict) -> Dict:
        """Compare Google Cloud vs Custom algorithm performance"""
        
        logger.info("🔬 Running algorithm comparison...")
        
        comparison = {
            'timestamp': str(datetime.now()),
            'package_count': len(packages),
            'algorithms': {}
        }
        
        # Test Google Cloud
        try:
            google_start = time.time()
            google_result = self.google_optimizer.optimize_route(packages, depot_location)
            google_time = time.time() - google_start
            
            comparison['algorithms']['google_cloud'] = {
                'status': 'success',
                'distance_km': google_result['total_distance_km'],
                'duration_minutes': google_result['total_duration_minutes'],
                'processing_time_seconds': google_time,
                'optimization_score': google_result.get('optimization_score', 0)
            }
        except Exception as e:
            comparison['algorithms']['google_cloud'] = {
                'status': 'failed',
                'error': str(e)
            }
        
        # Test Custom
        try:
            custom_start = time.time()
            custom_result = self.custom_optimizer.optimize_route(packages)
            custom_time = time.time() - custom_start
            
            comparison['algorithms']['custom'] = {
                'status': 'success',
                'distance_km': custom_result['total_distance_km'],
                'duration_minutes': custom_result.get('total_duration_minutes', custom_result['total_distance_km'] * 2),
                'processing_time_seconds': custom_time,
                'optimization_score': custom_result.get('optimization_score', 0)
            }
        except Exception as e:
            comparison['algorithms']['custom'] = {
                'status': 'failed',
                'error': str(e)
            }
        
        # Calculate improvements
        if (comparison['algorithms']['google_cloud'].get('status') == 'success' and 
            comparison['algorithms']['custom'].get('status') == 'success'):
            
            google_dist = comparison['algorithms']['google_cloud']['distance_km']
            custom_dist = comparison['algorithms']['custom']['distance_km']
            
            comparison['improvement_analysis'] = {
                'distance_improvement_percent': ((custom_dist - google_dist) / custom_dist) * 100,
                'google_cloud_better': google_dist < custom_dist,
                'distance_savings_km': custom_dist - google_dist
            }
        
        logger.info(f"🔬 Algorithm comparison completed")
        return comparison
    
    def get_status(self) -> Dict:
        """Get current status of hybrid optimizer"""
        google_available = self.google_optimizer and self.google_optimizer.is_available() if self.google_optimizer else False
        
        return {
            'google_cloud': {
                'available': google_available,
                'status': 'Ready' if google_available else 'Not configured'
            },
            'custom_algorithm': {
                'available': True,
                'status': 'Ready'
            },
            'configuration': {
                'prefer_google_cloud': self.prefer_google_cloud,
                'max_packages_for_google': self.max_packages_for_google,
                'comparison_mode': self.comparison_mode
            }
        }
    
    def configure(self, **kwargs):
        """Configure hybrid optimizer settings"""
        if 'prefer_google_cloud' in kwargs:
            self.prefer_google_cloud = kwargs['prefer_google_cloud']
        
        if 'max_packages_for_google' in kwargs:
            self.max_packages_for_google = kwargs['max_packages_for_google']
        
        if 'comparison_mode' in kwargs:
            self.comparison_mode = kwargs['comparison_mode']
        
        logger.info(f"🔧 Hybrid optimizer reconfigured: {kwargs}")


# For backward compatibility
from datetime import datetime
import time
