import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import { useToast } from "@/components/ui/toast";
import { debounce } from 'lodash';
import DonorFilters from '@/components/DonorFilters';

export default function Donors() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableFilters, setAvailableFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const fileInputRef = useRef(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  // Handle CSV file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Verify it's a CSV file
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }
    
    // Create FormData and append file
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      
      // Send the CSV file to the backend
      const response = await axios.post('/api/donor/import/csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast({
        title: "Upload Successful",
        description: `${response.data.importedCount || 'Multiple'} donors imported successfully.`,
      });
      
      // Refresh donor list
      fetchDonors();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to import donors. Please check your CSV format.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle filter changes
  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
    fetchDonors(1, searchTerm, filters);
  }, [searchTerm]);

  // Fetch donors with search and pagination
  const fetchDonors = async (page = 1, search = "", filters = {}) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        search,
        sortBy: 'updated_at',
        sortOrder: 'desc'
      };

      // Add filter parameters
      if (filters.minAge) params.minAge = filters.minAge;
      if (filters.maxAge) params.maxAge = filters.maxAge;
      if (filters.minDonationAmount) params.minDonationAmount = filters.minDonationAmount;
      if (filters.maxDonationAmount) params.maxDonationAmount = filters.maxDonationAmount;
      if (filters.minDonationCount) params.minDonationCount = filters.minDonationCount;
      if (filters.maxDonationCount) params.maxDonationCount = filters.maxDonationCount;
      if (filters.gender && filters.gender !== 'all') params.gender = filters.gender;
      if (filters.isCompany !== undefined) params.isCompany = filters.isCompany;
      
      // Handle array parameters
      if (filters.locations && filters.locations.length > 0) {
        params.location = filters.locations;
      }
      
      // Handle interest domains with level filtering
      if (filters.interestDomains && filters.interestDomains.length > 0) {
        params.interestDomains = filters.interestDomains.map(domain => domain.name);
        
        // Add interest level parameters for each domain
        filters.interestDomains.forEach((domain, index) => {
          params[`interestDomainLevel_${index}_name`] = domain.name;
          params[`interestDomainLevel_${index}_min`] = domain.minLevel;
          params[`interestDomainLevel_${index}_max`] = domain.maxLevel;
        });
        
        params.interestDomainsCount = filters.interestDomains.length;
      }
      
      if (filters.tags && filters.tags.length > 0) {
        params.tags = filters.tags;
      }

      const response = await axios.get(`/api/donor`, { params });
      setDonors(response.data.donors);
      setPagination(response.data.pagination);
      
      // Store available filters for the filter component
      if (response.data.filters) {
        setAvailableFilters(response.data.filters);
      }
    } catch (error) {
      console.error('Error fetching donors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch donors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  const debouncedSearch = debounce((value) => {
    fetchDonors(1, value, activeFilters);
  }, 500);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchDonors(newPage, searchTerm, activeFilters);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDonors();
    // Clean up debounce on unmount
    return () => {
      debouncedSearch.cancel();
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with title and button */}
      <div className="flex items-center justify-between w-full mb-6">
        <h1 className="text-2xl font-bold whitespace-nowrap flex-shrink-0">Donors</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/donors/create")}>
            Create Donor
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <Button variant="outline" onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}>
            Import CSV
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search donors by name, email, phone, address..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>
            <Button variant="outline" onClick={() => fetchDonors(1, searchTerm, activeFilters)}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Component */}
      <DonorFilters 
        onFilterChange={handleFilterChange} 
        availableFilters={availableFilters}
      />

      {/* Donors List */}
      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="text-center py-8">
              Loading donors...
            </div>
          ) : donors.length === 0 ? (
            <div className="text-center py-8">
              No donors found. Try a different search or create a new donor.
            </div>
          ) : (
            <div className="grid gap-4">
              {donors.map((donor) => (
                <Card 
                  key={donor.id} 
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => navigate(`/donors/${donor.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-medium">
                          {donor.is_company ? (
                            donor.organization_name
                          ) : (
                            `${donor.first_name || ''} ${donor.last_name || ''}`
                          )}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {donor.is_company ? "Company" : "Individual"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">{donor.email || "No email"}</p>
                        <p className="text-sm">{donor.phone_number || "No phone"}</p>
                        <p className="text-sm">
                          {[donor.city, donor.state, donor.country]
                            .filter(Boolean)
                            .join(", ") || "No location"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Total Donations:</span> {donor.total_donation_amount
                            ? `$${parseFloat(donor.total_donation_amount).toLocaleString()}`
                            : "$0"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Last Donation:</span> {donor.last_donation 
                            ? new Date(donor.last_donation.donation_date).toLocaleDateString() 
                            : "Never"}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {donor.tags && donor.tags.length > 0 
                            ? donor.tags.slice(0, 3).map(tagRel => (
                                <span 
                                  key={tagRel.tag.id}
                                  className="px-2 py-1 text-xs rounded-full text-white"
                                  style={{ backgroundColor: tagRel.tag.color || '#6366f1' }}
                                >
                                  {tagRel.tag.name}
                                </span>
                              ))
                            : <span className="text-xs text-gray-500">No tags</span>
                          }
                          {donor.tags && donor.tags.length > 3 && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-200">
                              +{donor.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="px-4">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}