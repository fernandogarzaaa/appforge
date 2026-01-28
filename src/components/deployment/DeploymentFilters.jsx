import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { DEPLOYMENT_STATUS, DEPLOYMENT_ENVIRONMENTS } from '@/lib/deploymentHistory';

export const DeploymentFilters = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all');

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
          <SelectTrigger className="md:w-40 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(DEPLOYMENT_STATUS).map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Environment Filter */}
        <Select value={filters.environment} onValueChange={(value) => onFilterChange('environment', value)}>
          <SelectTrigger className="md:w-40 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
            <SelectItem value="all">All Environments</SelectItem>
            {Object.values(DEPLOYMENT_ENVIRONMENTS).map((env) => (
              <SelectItem key={env} value={env} className="capitalize">
                {env}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Branch Filter */}
        <Input
          placeholder="Filter by branch..."
          value={filters.branch}
          onChange={(e) => onFilterChange('branch', e.target.value)}
          className="md:flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
        />

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.status && filters.status !== 'all' && (
            <Badge
              variant="secondary"
              className="dark:bg-gray-800 dark:text-gray-300 flex items-center gap-1"
            >
              Status: {filters.status.replace(/_/g, ' ')}
              <button
                onClick={() => onFilterChange('status', 'all')}
                className="ml-1 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </Badge>
          )}
          {filters.environment && filters.environment !== 'all' && (
            <Badge
              variant="secondary"
              className="dark:bg-gray-800 dark:text-gray-300 flex items-center gap-1"
            >
              Environment: {filters.environment}
              <button
                onClick={() => onFilterChange('environment', 'all')}
                className="ml-1 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </Badge>
          )}
          {filters.branch && (
            <Badge
              variant="secondary"
              className="dark:bg-gray-800 dark:text-gray-300 flex items-center gap-1"
            >
              Branch: {filters.branch}
              <button
                onClick={() => onFilterChange('branch', '')}
                className="ml-1 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default DeploymentFilters;
