import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FaArrowLeft, FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function DonorSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [donors, setDonors] = useState([])
  const [filteredDonors, setFilteredDonors] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortField, setSortField] = useState('first_name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [searchField, setSearchField] = useState('all')

  // 获取所有捐赠者数据
  useEffect(() => {
    const fetchDonors = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/donors')
        
        if (!response.ok) {
          throw new Error('Failed to fetch donors')
        }
        
        const data = await response.json()
        setDonors(data)
        setFilteredDonors(data)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching donors:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDonors()
  }, [])

  // 处理搜索功能
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDonors(donors)
      return
    }
    
    const lowercaseQuery = searchQuery.toLowerCase().trim()
    
    const result = donors.filter(donor => {
      // 如果选择了特定字段搜索
      if (searchField !== 'all') {
        const fieldValue = donor[searchField]
        if (!fieldValue) return false
        
        return String(fieldValue).toLowerCase().includes(lowercaseQuery)
      }
      
      // 全字段搜索
      return (
        (donor.first_name && donor.first_name.toLowerCase().includes(lowercaseQuery)) ||
        (donor.last_name && donor.last_name.toLowerCase().includes(lowercaseQuery)) ||
        (donor.nick_name && donor.nick_name.toLowerCase().includes(lowercaseQuery)) ||
        (donor.email && donor.email.toLowerCase().includes(lowercaseQuery)) ||
        (donor.phone_number && donor.phone_number.includes(lowercaseQuery)) ||
        (donor.organization_name && donor.organization_name.toLowerCase().includes(lowercaseQuery)) ||
        (donor.address && donor.address.toLowerCase().includes(lowercaseQuery)) ||
        (donor.city && donor.city.toLowerCase().includes(lowercaseQuery)) ||
        // 捐赠金额搜索
        (donor.total_donation_amount && donor.total_donation_amount.toString().includes(lowercaseQuery))
      )
    })
    
    setFilteredDonors(result)
  }, [searchQuery, searchField, donors])

  // 处理排序功能
  useEffect(() => {
    if (!sortField) return
    
    const sorted = [...filteredDonors].sort((a, b) => {
      const fieldA = a[sortField] || ''
      const fieldB = b[sortField] || ''
      
      if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA)
      }
      
      return sortDirection === 'asc' 
        ? fieldA - fieldB
        : fieldB - fieldA
    })
    
    setFilteredDonors(sorted)
  }, [sortField, sortDirection])

  // 切换排序方向
  const toggleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 格式化显示金额
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link to="/donors">
            <Button variant="outline" size="icon">
              <FaArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Donor Search</h1>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Donors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search donors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                value={searchField}
                onValueChange={setSearchField}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search in..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="first_name">First Name</SelectItem>
                  <SelectItem value="last_name">Last Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone_number">Phone</SelectItem>
                  <SelectItem value="organization_name">Organization</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="total_donation_amount">Donation Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="md:w-auto">
              <FaSearch className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      ) : (
        <>
          <div className="mb-2 text-sm text-gray-500">
            Found {filteredDonors.length} {filteredDonors.length === 1 ? 'donor' : 'donors'}
            {searchQuery ? ` matching "${searchQuery}"` : ''}
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('first_name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortField === 'first_name' && (
                        sortDirection === 'asc' ? 
                          <FaSortAlphaDown className="ml-1" /> : 
                          <FaSortAlphaUp className="ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('email')}
                  >
                    <div className="flex items-center">
                      Email
                      {sortField === 'email' && (
                        sortDirection === 'asc' ? 
                          <FaSortAlphaDown className="ml-1" /> : 
                          <FaSortAlphaUp className="ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('phone_number')}
                  >
                    <div className="flex items-center">
                      Phone
                      {sortField === 'phone_number' && (
                        sortDirection === 'asc' ? 
                          <FaSortAlphaDown className="ml-1" /> : 
                          <FaSortAlphaUp className="ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('organization_name')}
                  >
                    <div className="flex items-center">
                      Organization
                      {sortField === 'organization_name' && (
                        sortDirection === 'asc' ? 
                          <FaSortAlphaDown className="ml-1" /> : 
                          <FaSortAlphaUp className="ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('total_donation_amount')}
                  >
                    <div className="flex items-center">
                      Total Donations
                      {sortField === 'total_donation_amount' && (
                        sortDirection === 'asc' ? 
                          <FaSortAlphaDown className="ml-1" /> : 
                          <FaSortAlphaUp className="ml-1" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No donors found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDonors.map(donor => (
                    <TableRow key={donor.id}>
                      <TableCell>
                        <div className="font-medium">
                          {donor.first_name} {donor.last_name}
                        </div>
                        {donor.nick_name && (
                          <div className="text-sm text-gray-500">
                            "{donor.nick_name}"
                          </div>
                        )}
                        {donor.is_company && (
                          <Badge variant="outline" className="mt-1">Company</Badge>
                        )}
                      </TableCell>
                      <TableCell>{donor.email || '-'}</TableCell>
                      <TableCell>{donor.phone_number || '-'}</TableCell>
                      <TableCell>{donor.organization_name || '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(donor.total_donation_amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {donor.total_donations_count} donations
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {donor.tags && donor.tags.map(tag => (
                            <Badge key={tag.tag_id} 
                              style={{ backgroundColor: tag.tag?.color || '#888888' }}
                              className="text-white"
                            >
                              {tag.tag?.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link to={`/donors/${donor.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                          <Link to={`/donors/${donor.id}/edit`}>
                            <Button size="sm">Edit</Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
} 