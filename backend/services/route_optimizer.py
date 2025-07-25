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
        """Optimize delivery route using OR-Tools"""
        if not packages:
            return {'stops': [], 'total_distance': 0, 'estimated_duration': 0}
        
        # Add depot (starting point) - use first package location as depot for simplicity
        depot_location = {
            'id': 0,
            'kargo_id': 'DEPOT',
            'address': 'Depot',
            'recipient_name': 'Depot',
            'delivery_type': 'depot',
            'latitude': packages[0]['latitude'],
            'longitude': packages[0]['longitude']
        }
        
        # Create locations list with depot first
        locations = [depot_location] + packages
        
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
        
        # Add delivery priority constraints
        for i, location in enumerate(locations[1:], 1):  # Skip depot
            priority = self.get_delivery_priority(location['delivery_type'])
            node_index = manager.NodeToIndex(i)
            
            # Add penalty for not delivering express packages
            if location['delivery_type'] == 'express':
                routing.AddDisjunction([node_index], 10000)  # High penalty
            else:
                routing.AddDisjunction([node_index], 100)    # Lower penalty
        
        # Add time window constraints for scheduled deliveries
        time_dimension_name = 'Time'
        horizon = 24 * 60  # 24 hours in minutes
        capacity = 10 * 60  # 10 minutes per delivery
        
        routing.AddDimension(
            transit_callback_index,
            horizon,  # allow waiting time
            horizon,  # maximum time per vehicle
            False,    # don't force start cumul to zero
            time_dimension_name
        )
        time_dimension = routing.GetDimensionOrDie(time_dimension_name)
        
        # Set time windows for scheduled deliveries
        for i, location in enumerate(locations[1:], 1):  # Skip depot
            if location['delivery_type'] == 'scheduled':
                start_time = self.time_to_minutes(location.get('time_window_start', '08:00'))
                end_time = self.time_to_minutes(location.get('time_window_end', '18:00'))
                
                index = manager.NodeToIndex(i)
                time_dimension.CumulVar(index).SetRange(start_time, end_time)
        
        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(10)  # 10 seconds timeout
        
        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)
        
        if solution:
            return self.extract_solution(manager, routing, solution, locations)
        else:
            # Fallback: simple nearest neighbor
            return self.fallback_optimization(packages)
    
    def extract_solution(self, manager, routing, solution, locations) -> Dict[str, Any]:
        """Extract optimized route from OR-Tools solution"""
        route_stops = []
        total_distance = 0
        current_time = 8 * 60  # Start at 8 AM
        
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
                    'estimated_arrival': estimated_arrival
                })
                
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
    
    def fallback_optimization(self, packages: List[Dict]) -> Dict[str, Any]:
        """Fallback optimization using simple priority and nearest neighbor"""
        # Sort by priority first
        sorted_packages = sorted(packages, key=lambda x: (
            self.get_delivery_priority(x['delivery_type']),
            x['kargo_id']
        ))
        
        route_stops = []
        total_distance = 0
        current_time = 8 * 60  # Start at 8 AM
        
        for i, package in enumerate(sorted_packages):
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
                'estimated_arrival': estimated_arrival
            })
            
            # Calculate distance to next stop
            if i < len(sorted_packages) - 1:
                next_package = sorted_packages[i + 1]
                distance = self.calculate_distance(
                    package['latitude'], package['longitude'],
                    next_package['latitude'], next_package['longitude']
                )
                total_distance += distance
            
            current_time += 15  # 15 minutes per delivery
        
        estimated_duration = len(route_stops) * 15
        
        return {
            'stops': route_stops,
            'total_distance': round(total_distance, 2),
            'estimated_duration': estimated_duration
        }
