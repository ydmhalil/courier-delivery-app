from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import math
from typing import List, Dict, Any
from datetime import datetime, timedelta

class RouteOptimizer:
    """AI-powered route optimization using Google OR-Tools"""
    
    def __init__(self):
        self.earth_radius = 6371  # Earth radius in kilometers
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        # Convert latitude and longitude from degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return self.earth_radius * c
    
    def create_distance_matrix(self, locations: List[Dict]) -> List[List[int]]:
        """Create distance matrix for all locations"""
        n = len(locations)
        distance_matrix = [[0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i != j:
                    dist = self.calculate_distance(
                        locations[i]['latitude'], locations[i]['longitude'],
                        locations[j]['latitude'], locations[j]['longitude']
                    )
                    # Convert to meters and round to integer
                    distance_matrix[i][j] = int(dist * 1000)
        
        return distance_matrix
    
    def get_delivery_priority(self, delivery_type: str) -> int:
        """Get priority score for delivery type (lower = higher priority)"""
        priority_map = {
            'express': 1,
            'scheduled': 2,
            'standard': 3
        }
        return priority_map.get(delivery_type, 3)
    
    def time_to_minutes(self, time_str: str) -> int:
        """Convert time string (HH:MM) to minutes since midnight"""
        if not time_str:
            return 0
        try:
            hours, minutes = map(int, time_str.split(':'))
            return hours * 60 + minutes
        except:
            return 0
    
    def optimize_route(self, packages: List[Dict]) -> Dict[str, Any]:
        """Optimize delivery route using HYBRID SMART ALGORITHM"""
        if not packages:
            return {'stops': [], 'total_distance': 0, 'estimated_duration': 0}

        # Add depot (Kadıköy Kargo Merkezi) - central location in Kadıköy
        depot_location = {
            'id': 0,
            'kargo_id': 'DEPOT',
            'address': 'Kadıköy Kargo Merkezi, Moda Caddesi No:1, Kadıköy, İstanbul',
            'recipient_name': 'Kargo Merkezi',
            'delivery_type': 'depot',
            'latitude': 40.9877,    # Kadıköy merkez koordinat
            'longitude': 29.0283    # Kadıköy merkez koordinat
        }

        # Create locations list with depot first
        locations = [depot_location] + packages

        # Use HYBRID optimization: Geographic clustering + Priority balancing
        try:
            return self.hybrid_smart_optimization(packages, depot_location)
        except Exception as e:
            print(f"Hybrid optimization failed: {str(e)}, using OR-Tools fallback...")
            try:
                return self.ortools_optimization(locations)
            except Exception as e2:
                print(f"OR-Tools also failed: {str(e2)}, using simple fallback...")
                return self.fallback_optimization(packages, depot_location)

    def hybrid_smart_optimization(self, packages: List[Dict], depot_location: Dict) -> Dict[str, Any]:
        """HYBRID SMART ALGORITHM: Geography + Priority + Customer Satisfaction"""
        
        # STEP 1: GEOGRAPHIC CLUSTERING
        # Group packages by proximity (same neighborhood/street efficiency)
        clusters = self.create_geographic_clusters(packages, depot_location)
        
        # STEP 2: PRIORITY BALANCING WITHIN CLUSTERS
        optimized_clusters = []
        for cluster in clusters:
            # Balance delivery types within each cluster
            balanced_cluster = self.balance_delivery_types_in_cluster(cluster)
            optimized_clusters.append(balanced_cluster)
        
        # STEP 3: CLUSTER ORDERING BY STRATEGIC FACTORS
        ordered_clusters = self.order_clusters_strategically(optimized_clusters, depot_location)
        
        # STEP 4: FINAL ROUTE CONSTRUCTION
        return self.construct_final_route(ordered_clusters, depot_location)

    def create_geographic_clusters(self, packages: List[Dict], depot_location: Dict) -> List[List[Dict]]:
        """Group packages by geographic proximity (neighborhood-based clustering)"""
        clusters = []
        remaining_packages = packages.copy()
        
        while remaining_packages:
            # Start new cluster with the nearest unvisited package
            if not clusters:
                # First cluster: start with closest to depot
                seed_package = min(remaining_packages, key=lambda p: self.calculate_distance(
                    depot_location['latitude'], depot_location['longitude'],
                    p['latitude'], p['longitude']
                ))
            else:
                # Next clusters: start with package closest to last cluster's center
                last_cluster = clusters[-1]
                cluster_center_lat = sum(p['latitude'] for p in last_cluster) / len(last_cluster)
                cluster_center_lon = sum(p['longitude'] for p in last_cluster) / len(last_cluster)
                
                seed_package = min(remaining_packages, key=lambda p: self.calculate_distance(
                    cluster_center_lat, cluster_center_lon,
                    p['latitude'], p['longitude']
                ))
            
            # Create cluster around seed package
            current_cluster = [seed_package]
            remaining_packages.remove(seed_package)
            
            # Add nearby packages to current cluster (within 2km radius)
            cluster_radius = 2.0  # 2km radius for efficient delivery
            packages_to_add = []
            
            for package in remaining_packages:
                min_distance_to_cluster = min(
                    self.calculate_distance(
                        cluster_pkg['latitude'], cluster_pkg['longitude'],
                        package['latitude'], package['longitude']
                    ) for cluster_pkg in current_cluster
                )
                
                if min_distance_to_cluster <= cluster_radius:
                    packages_to_add.append(package)
            
            # Add nearby packages to cluster
            for package in packages_to_add:
                current_cluster.append(package)
                remaining_packages.remove(package)
            
            clusters.append(current_cluster)
            
            # Limit cluster size (max 4 packages for efficiency)
            if len(current_cluster) > 4:
                # Split large cluster
                mid_point = len(current_cluster) // 2
                clusters[-1] = current_cluster[:mid_point]
                remaining_packages.extend(current_cluster[mid_point:])
        
        return clusters

    def balance_delivery_types_in_cluster(self, cluster: List[Dict]) -> List[Dict]:
        """Balance delivery types within a cluster for optimal customer satisfaction"""
        
        # Separate by delivery type
        express_pkgs = [p for p in cluster if p.get('delivery_type') == 'express']
        scheduled_pkgs = [p for p in cluster if p.get('delivery_type') == 'scheduled']
        standard_pkgs = [p for p in cluster if p.get('delivery_type') == 'standard']
        
        # SMART ORDERING WITHIN CLUSTER:
        balanced_cluster = []
        
        # 1. If express exists, place one at the beginning (not all at once)
        if express_pkgs:
            balanced_cluster.append(express_pkgs.pop(0))
        
        # 2. Interleave other types to balance customer waiting times
        all_remaining = scheduled_pkgs + standard_pkgs + express_pkgs
        
        # Sort remaining by distance efficiency within cluster
        if balanced_cluster:
            # Sort by distance from first package
            first_pkg = balanced_cluster[0]
            all_remaining.sort(key=lambda p: self.calculate_distance(
                first_pkg['latitude'], first_pkg['longitude'],
                p['latitude'], p['longitude']
            ))
        
        balanced_cluster.extend(all_remaining)
        return balanced_cluster

    def order_clusters_strategically(self, clusters: List[List[Dict]], depot_location: Dict) -> List[List[Dict]]:
        """Order clusters using HYBRID strategy: Distance + Priority + Time constraints"""
        if not clusters:
            return []
            
        ordered_clusters = []
        remaining_clusters = clusters.copy()
        current_lat, current_lon = depot_location['latitude'], depot_location['longitude']
        
        print(f"🗺️ Ordering {len(clusters)} clusters using hybrid distance+priority...")
        
        while remaining_clusters:
            # Calculate hybrid score for each cluster
            best_cluster = None
            best_score = -1
            
            for cluster in remaining_clusters:
                # Factor 1: Distance (40% weight) - closer is better
                cluster_center_lat = sum(p['latitude'] for p in cluster) / len(cluster)
                cluster_center_lon = sum(p['longitude'] for p in cluster) / len(cluster)
                
                distance = self.calculate_distance(
                    current_lat, current_lon,
                    cluster_center_lat, cluster_center_lon
                )
                distance_score = 1 / (distance + 0.1)  # Normalize distance
                
                # Factor 2: Delivery Priority (40% weight)
                priority_score = 0
                for package in cluster:
                    delivery_type = package.get('delivery_type', 'standard').lower()
                    if delivery_type == 'express':
                        priority_score += 3  # Highest priority
                    elif delivery_type == 'scheduled':
                        priority_score += 2  # Medium priority
                    else:  # standard
                        priority_score += 1  # Lowest priority
                priority_score = priority_score / len(cluster)  # Average priority
                
                # Factor 3: Time Constraints (20% weight)
                time_score = 0
                current_hour = 8 + len(ordered_clusters) * 2  # Approximate time progression
                for package in cluster:
                    if package.get('delivery_type', '').lower() == 'scheduled':
                        time_window_start = package.get('time_window_start', '09:00')
                        start_hour = int(time_window_start.split(':')[0])
                        if start_hour <= current_hour + 2:  # Urgent time window
                            time_score += 2
                        elif start_hour <= current_hour + 4:  # Medium urgency
                            time_score += 1
                if len(cluster) > 0:
                    time_score = time_score / len(cluster)
                
                # Calculate weighted hybrid score
                hybrid_score = (
                    distance_score * 0.40 +    # Distance efficiency
                    priority_score * 0.40 +    # Delivery priority
                    time_score * 0.20          # Time constraints
                )
                
                if hybrid_score > best_score:
                    best_score = hybrid_score
                    best_cluster = cluster
            
            # Add best cluster to route
            if best_cluster:
                ordered_clusters.append(best_cluster)
                remaining_clusters.remove(best_cluster)
                
                # Update current position to end of this cluster
                last_package = best_cluster[-1]
                current_lat, current_lon = last_package['latitude'], last_package['longitude']
                
                # Log cluster selection reasoning
                cluster_types = [p.get('delivery_type', 'standard') for p in best_cluster]
                express_count = cluster_types.count('express')
                scheduled_count = cluster_types.count('scheduled')
                standard_count = cluster_types.count('standard')
                
                print(f"🗺️ Selected cluster: {len(best_cluster)} packages")
                print(f"   📦 Types: {express_count} Express, {scheduled_count} Scheduled, {standard_count} Standard")
                print(f"   🎯 Score: {best_score:.3f} (Distance + Priority + Time)")
        
        return ordered_clusters

    def construct_final_route(self, ordered_clusters: List[List[Dict]], depot_location: Dict) -> Dict[str, Any]:
        """Construct final optimized route from ordered clusters"""
        
        route_stops = []
        current_time = 8 * 60  # Start at 8 AM
        current_lat, current_lon = depot_location['latitude'], depot_location['longitude']
        sequence = 1
        
        # ADD DEPOT AS FIRST STOP
        route_stops.append({
            'id': 0,
            'kargo_id': 'DEPOT',
            'address': depot_location['address'],
            'recipient_name': depot_location['recipient_name'],
            'delivery_type': 'depot',
            'time_window_start': None,
            'time_window_end': None,
            'latitude': depot_location['latitude'],
            'longitude': depot_location['longitude'],
            'estimated_arrival': f"{(current_time // 60):02d}:{(current_time % 60):02d}",
            'sequence': 0,  # Depot is sequence 0
            'cluster_id': 0
        })
        
        for cluster_index, cluster in enumerate(ordered_clusters):
            # Process each package in cluster
            for pkg_index, package in enumerate(cluster):
                # Handle scheduled delivery constraints
                delivery_type = package.get('delivery_type', 'STANDARD')  # Fix enum case
                if delivery_type == 'SCHEDULED':  # Fix enum comparison
                    start_time = self.time_to_minutes(package.get('time_window_start', '09:00'))
                    end_time = self.time_to_minutes(package.get('time_window_end', '17:00'))
                    
                    if current_time < start_time:
                        current_time = start_time  # Wait for window to open
                    elif current_time > end_time:
                        current_time = max(start_time, current_time - 30)  # Try to fit in
                
                estimated_arrival = f"{(current_time // 60):02d}:{(current_time % 60):02d}"
                
                route_stops.append({
                    'id': package['id'],
                    'kargo_id': package['kargo_id'],
                    'address': package['address'],
                    'recipient_name': package['recipient_name'],
                    'delivery_type': package['delivery_type'],
                    'time_window_start': package.get('time_window_start'),
                    'time_window_end': package.get('time_window_end'),
                    'latitude': package['latitude'],
                    'longitude': package['longitude'],
                    'estimated_arrival': estimated_arrival,
                    'sequence': sequence,
                    'cluster_id': cluster_index + 1
                })
                
                # Update current position and time
                current_lat, current_lon = package['latitude'], package['longitude']
                current_time += 15  # 15 minutes per delivery
                sequence += 1
        
        # Calculate REAL total distance following the actual route
        total_distance = self.calculate_real_route_distance(route_stops)
        estimated_duration = len(route_stops) * 15
        
        return {
            'stops': route_stops,
            'total_distance': round(total_distance, 2),
            'estimated_duration': estimated_duration,
            'optimization_method': 'Hybrid Smart Algorithm'
        }
    
    def calculate_real_route_distance(self, route_stops: List[Dict]) -> float:
        """Calculate the actual total distance following the route sequence"""
        total_distance = 0.0
        
        print(f"🔍 DEBUG: Calculating distance for {len(route_stops)} stops")
        
        for i in range(len(route_stops) - 1):
            current_stop = route_stops[i]
            next_stop = route_stops[i + 1]
            
            distance = self.calculate_distance(
                current_stop['latitude'], current_stop['longitude'],
                next_stop['latitude'], next_stop['longitude']
            )
            total_distance += distance
            
            # Debug ALL distances to find the problem
            print(f"🔍 Distance {i} -> {i+1}: {distance:.2f} km ({current_stop.get('kargo_id', 'Unknown')} -> {next_stop.get('kargo_id', 'Unknown')})")
            
            # Alert for suspiciously large distances
            if distance > 50:
                print(f"⚠️  SUSPICIOUS DISTANCE: {distance:.2f} km!")
                print(f"   From: {current_stop.get('kargo_id')} at ({current_stop['latitude']}, {current_stop['longitude']})")
                print(f"   To: {next_stop.get('kargo_id')} at ({next_stop['latitude']}, {next_stop['longitude']})")
            
        # Add return to depot distance
        if len(route_stops) > 1:
            last_stop = route_stops[-1]
            depot = route_stops[0]  # First stop is depot
            return_distance = self.calculate_distance(
                last_stop['latitude'], last_stop['longitude'],
                depot['latitude'], depot['longitude']
            )
            total_distance += return_distance
            print(f"🔍 Return to depot: {return_distance:.2f} km")
            
        print(f"🔍 TOTAL DISTANCE: {total_distance:.2f} km")
        return total_distance


    def ortools_optimization(self, locations: List[Dict]) -> Dict[str, Any]:
        """Use OR-Tools for route optimization"""
        
        # Create distance matrix
        distance_matrix = self.create_distance_matrix(locations)
        
        # Create routing model
        manager = pywrapcp.RoutingIndexManager(
            len(distance_matrix),
            1,  # number of vehicles (couriers)
            0   # depot index
        )
        routing = pywrapcp.RoutingModel(manager)
        
    def ortools_optimization(self, locations: List[Dict]) -> Dict[str, Any]:
        """Use OR-Tools for route optimization with delivery type constraints"""
        # Create distance matrix
        distance_matrix = self.create_distance_matrix(locations)
        
        # Create routing model
        manager = pywrapcp.RoutingIndexManager(
            len(distance_matrix),
            1,  # number of vehicles (couriers)
            0   # depot index
        )
        routing = pywrapcp.RoutingModel(manager)
        
        # Create distance callback
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return distance_matrix[from_node][to_node]
        
        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
        
        # Add TIME WINDOW constraints for SCHEDULED deliveries
        time_dimension_name = 'Time'
        routing.AddDimension(
            transit_callback_index,
            30,    # allow waiting time (30 min slack)
            480,   # maximum time per vehicle (8 hours)
            False, # Don't force start cumul to zero
            time_dimension_name
        )
        time_dimension = routing.GetDimensionOrDie(time_dimension_name)
        
        # Apply time windows based on delivery type
        for i, location in enumerate(locations):
            if i == 0:  # Skip depot
                continue
                
            node_index = manager.NodeToIndex(i)
            delivery_type = location.get('delivery_type', 'standard')
            
            if delivery_type == 'express':
                # Express: Must be delivered within first 4 hours (before 12:00)
                time_dimension.CumulVar(node_index).SetRange(0, 240)  # 4 hours
                # Add high priority penalty
                routing.AddDisjunction([node_index], 50000)  # Very high penalty = priority
                
            elif delivery_type == 'scheduled':
                # Scheduled: Must respect time windows
                start_time = self.time_to_minutes(location.get('time_window_start', '09:00'))
                end_time = self.time_to_minutes(location.get('time_window_end', '17:00'))
                time_dimension.CumulVar(node_index).SetRange(start_time, end_time)
                # High penalty for not delivering
                routing.AddDisjunction([node_index], 30000)
                
            else:  # standard
                # Standard: Can be delivered anytime, lower priority
                time_dimension.CumulVar(node_index).SetRange(0, 480)  # Full day
                routing.AddDisjunction([node_index], 10000)  # Lower penalty
        
        # Add DELIVERY TYPE priority constraint
        def priority_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            
            # Bonus for visiting express packages early
            if to_node > 0:  # Not depot
                delivery_type = locations[to_node].get('delivery_type', 'standard')
                if delivery_type == 'express':
                    return distance_matrix[from_node][to_node] - 500  # Express bonus
                elif delivery_type == 'scheduled':
                    return distance_matrix[from_node][to_node] - 200  # Scheduled bonus
            
            return distance_matrix[from_node][to_node]
        
        priority_callback_index = routing.RegisterTransitCallback(priority_callback)
        
        # Set search parameters - prioritize solution quality
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(45)  # More time for complex optimization
        
        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)
        
        if solution:
            return self.extract_solution(manager, routing, solution, locations)
        else:
            # Fallback: simple nearest neighbor
            packages = locations[1:]  # Remove depot
            depot_location = locations[0]  # Get depot
            return self.fallback_optimization(packages, depot_location)
    
    def extract_solution(self, manager, routing, solution, locations) -> Dict[str, Any]:
        """Extract optimized route from OR-Tools solution"""
        route_stops = []
        total_distance = 0
        current_time = 8 * 60  # Start at 8 AM
        sequence = 1
        
        index = routing.Start(0)
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            if node_index > 0:  # Skip depot
                location = locations[node_index]
                
                # Calculate estimated arrival time
                estimated_arrival = f"{(current_time // 60):02d}:{(current_time % 60):02d}"
                
                route_stops.append({
                    'id': location['id'],
                    'kargo_id': location['kargo_id'],
                    'address': location['address'],
                    'recipient_name': location['recipient_name'],
                    'delivery_type': location['delivery_type'],
                    'time_window_start': location.get('time_window_start'),
                    'time_window_end': location.get('time_window_end'),
                    'latitude': location['latitude'],
                    'longitude': location['longitude'],
                    'estimated_arrival': estimated_arrival,
                    'sequence': sequence
                })
                
                sequence += 1
                current_time += 15  # 15 minutes per delivery
            
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            
            if not routing.IsEnd(index):
                from_node = manager.IndexToNode(previous_index)
                to_node = manager.IndexToNode(index)
                total_distance += self.calculate_distance(
                    locations[from_node]['latitude'], locations[from_node]['longitude'],
                    locations[to_node]['latitude'], locations[to_node]['longitude']
                )
        
        estimated_duration = len(route_stops) * 15  # 15 minutes per stop
        
        return {
            'stops': route_stops,
            'total_distance': round(total_distance, 2),
            'estimated_duration': estimated_duration
        }
    
    def fallback_optimization(self, packages: List[Dict], depot_location: Dict) -> Dict[str, Any]:
        """Fallback optimization using delivery type priority and smart scheduling"""
        
        # 1. SEPARATE BY DELIVERY TYPE
        express_packages = [p for p in packages if p.get('delivery_type') == 'express']
        scheduled_packages = [p for p in packages if p.get('delivery_type') == 'scheduled']
        standard_packages = [p for p in packages if p.get('delivery_type') == 'standard']
        
        # 2. SORT EACH TYPE OPTIMALLY
        # Express: By distance from depot (closest first for speed)
        express_packages.sort(key=lambda x: self.calculate_distance(
            depot_location['latitude'], depot_location['longitude'],
            x['latitude'], x['longitude']
        ))
        
        # Scheduled: By time window start (earliest window first)
        scheduled_packages.sort(key=lambda x: self.time_to_minutes(
            x.get('time_window_start', '09:00')
        ))
        
        # Standard: By distance (efficient route)
        standard_packages.sort(key=lambda x: self.calculate_distance(
            depot_location['latitude'], depot_location['longitude'],
            x['latitude'], x['longitude']
        ))
        
        # 3. COMBINE IN PRIORITY ORDER: Express → Scheduled → Standard
        prioritized_packages = express_packages + scheduled_packages + standard_packages
        
        # 4. BUILD OPTIMIZED ROUTE
        route_stops = []
        total_distance = 0
        current_time = 8 * 60  # Start at 8 AM
        current_lat, current_lon = depot_location['latitude'], depot_location['longitude']
        
        for i, package in enumerate(prioritized_packages):
            # Calculate distance from current position
            distance_to_package = self.calculate_distance(
                current_lat, current_lon,
                package['latitude'], package['longitude']
            )
            total_distance += distance_to_package
            
            # Calculate travel time (assuming 30 km/h average speed in city)
            travel_time_minutes = int((distance_to_package / 30) * 60)
            current_time += travel_time_minutes
            
            # Check delivery type constraints
            delivery_type = package.get('delivery_type', 'standard')
            
            if delivery_type == 'scheduled':
                # Ensure we're within time window
                start_time = self.time_to_minutes(package.get('time_window_start', '09:00'))
                end_time = self.time_to_minutes(package.get('time_window_end', '17:00'))
                
                if current_time < start_time:
                    current_time = start_time  # Wait until window opens
                elif current_time > end_time:
                    current_time = end_time - 15  # Rush to make it
            
            estimated_arrival = f"{(current_time // 60):02d}:{(current_time % 60):02d}"
            
            route_stops.append({
                'id': package['id'],
                'kargo_id': package['kargo_id'],
                'address': package['address'],
                'recipient_name': package['recipient_name'],
                'delivery_type': package['delivery_type'],
                'time_window_start': package.get('time_window_start'),
                'time_window_end': package.get('time_window_end'),
                'latitude': package['latitude'],
                'longitude': package['longitude'],
                'estimated_arrival': estimated_arrival,
                'sequence': i + 1
            })
            
            # Update current position
            current_lat, current_lon = package['latitude'], package['longitude']
            current_time += 15  # 15 minutes per delivery
        
        estimated_duration = len(route_stops) * 15
        
        return {
            'stops': route_stops,
            'total_distance': round(total_distance, 2),
            'estimated_duration': estimated_duration
        }
