import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FaArrowLeft, FaSortAlphaDown, FaSortAlphaUp, FaTimesCircle } from 'react-icons/fa'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function DonorFilter() {
  const [tags, setTags] = useState([])
  const [donors, setDonors] = useState([])
  const [filteredDonors, setFilteredDonors] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [isLoadingDonors, setIsLoadingDonors] = useState(false)
  const [tagError, setTagError] = useState(null)
  const [donorError, setDonorError] = useState(null)
  const [sortField, setSortField] = useState('first_name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [filteredTags, setFilteredTags] = useState([])

  // 获取所有标签
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoadingTags(true)
      setTagError(null)
      try {
        const response = await fetch('/api/tags')
        
        if (!response.ok) {
          throw new Error('Failed to fetch tags')
        }
        
        const data = await response.json()
        setTags(data)
        setFilteredTags(data)
      } catch (err) {
        setTagError(err.message)
        console.error('Error fetching tags:', err)
      } finally {
        setIsLoadingTags(false)
      }
    }
    
    fetchTags()
  }, [])

  // 获取所有捐赠者
  useEffect(() => {
    const fetchDonors = async () => {
      setIsLoadingDonors(true)
      setDonorError(null)
      try {
        const response = await fetch('/api/donors')
        
        if (!response.ok) {
          throw new Error('Failed to fetch donors')
        }
        
        const data = await response.json()
        setDonors(data)
        setFilteredDonors(data)
      } catch (err) {
        setDonorError(err.message)
        console.error('Error fetching donors:', err)
      } finally {
        setIsLoadingDonors(false)
      }
    }
    
    fetchDonors()
  }, [])

  // 根据标签筛选捐赠者
  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredDonors(donors)
      return
    }
    
    const filtered = donors.filter(donor => {
      // 如果捐赠者没有标签，则不匹配
      if (!donor.tags || donor.tags.length === 0) return false
      
      // 检查是否有任何选定的标签与捐赠者的标签匹配
      return selectedTags.some(selectedTagId => 
        donor.tags.some(donorTag => donorTag.tag_id === selectedTagId)
      )
    })
    
    setFilteredDonors(filtered)
  }, [selectedTags, donors])

  // 更新标签搜索结果
  useEffect(() => {
    if (!tagSearchQuery.trim()) {
      setFilteredTags(tags)
      return
    }
    
    const lowercaseQuery = tagSearchQuery.toLowerCase().trim()
    const result = tags.filter(tag => 
      tag.name.toLowerCase().includes(lowercaseQuery) ||
      (tag.description && tag.description.toLowerCase().includes(lowercaseQuery))
    )
    
    setFilteredTags(result)
  }, [tagSearchQuery, tags])

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
  }, [sortField, sortDirection, filteredDonors.length])

  // 切换排序方向
  const toggleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 处理标签选择/取消选择
  const handleTagToggle = (tagId) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId)
      } else {
        return [...prev, tagId]
      }
    })
  }

  // 清除所有已选标签
  const clearAllTags = () => {
    setSelectedTags([])
  }

  // 格式化显示金额
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link to="/donors">
            <Button variant="outline" size="icon">
              <FaArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Donor Filter</h1>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 h-full">
        {/* 标签筛选侧边栏 */}
        <div className="md:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Filter by Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {selectedTags.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm font-medium">Selected Tags:</div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearAllTags}
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedTags.map(tagId => {
                      const tag = tags.find(t => t.id === tagId)
                      if (!tag) return null
                      return (
                        <Badge 
                          key={tag.id}
                          style={{ backgroundColor: tag.color || '#888888' }}
                          className="text-white"
                        >
                          {tag.name}
                          <FaTimesCircle 
                            className="ml-1 cursor-pointer" 
                            onClick={() => handleTagToggle(tag.id)}
                          />
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {isLoadingTags ? (
                <div className="flex justify-center my-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : tagError ? (
                <div className="text-red-500 text-sm my-2">
                  Error loading tags: {tagError}
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="text-gray-500 text-sm my-2">
                  No tags found.
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {filteredTags.map(tag => (
                    <div key={tag.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag.id}`}
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={() => handleTagToggle(tag.id)}
                      />
                      <Label 
                        htmlFor={`tag-${tag.id}`}
                        className="flex items-center cursor-pointer"
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: tag.color || '#888888' }}
                        ></div>
                        <span>{tag.name}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* 捐赠者列表显示区域 */}
        <div className="md:col-span-2">
          {isLoadingDonors ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : donorError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error: {donorError}
            </div>
          ) : (
            <>
              <div className="mb-2 text-sm text-gray-500">
                Found {filteredDonors.length} {filteredDonors.length === 1 ? 'donor' : 'donors'}
                {selectedTags.length > 0 && ' matching selected tags'}
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
                      <TableHead>Tags</TableHead>
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
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          {selectedTags.length > 0 
                            ? 'No donors found matching the selected tags.' 
                            : 'No donors found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDonors.map(donor => (
                        <TableRow key={donor.id}>
                          <TableCell>
                            <div className="font-medium">
                              {donor.first_name} {donor.last_name}
                            </div>
                            {donor.is_company && (
                              <Badge variant="outline" className="mt-1">Company</Badge>
                            )}
                          </TableCell>
                          <TableCell>{donor.email || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {donor.tags && donor.tags.map(tag => (
                                <Badge 
                                  key={tag.tag_id}
                                  style={{ 
                                    backgroundColor: tag.tag?.color || '#888888',
                                    opacity: selectedTags.includes(tag.tag_id) ? 1 : 0.6
                                  }}
                                  className="text-white"
                                >
                                  {tag.tag?.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(donor.total_donation_amount)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {donor.total_donations_count} donations
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
      </div>
    </div>
  )
} 