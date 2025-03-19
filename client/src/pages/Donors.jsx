import React from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FaSearch, FaFilter } from 'react-icons/fa'

export default function Donors() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Donors Management</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Donor Search</h2>
              <p className="text-gray-500">Search donors by any criteria</p>
            </div>
            <FaSearch className="text-3xl text-primary" />
          </div>
          <p className="mb-4">
            Find donors quickly by searching across any donor information including
            name, email, phone, donation history, and more.
          </p>
          <Link to="/donors/search">
            <Button className="w-full">
              Go to Search
            </Button>
          </Link>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Donor Filter</h2>
              <p className="text-gray-500">Filter donors by tags</p>
            </div>
            <FaFilter className="text-3xl text-primary" />
          </div>
          <p className="mb-4">
            Use tags to filter donors into specific groups and access donor
            segments quickly based on interests, categories, and more.
          </p>
          <Link to="/donors/filter">
            <Button className="w-full">
              Go to Filter
            </Button>
          </Link>
        </Card>
      </div>
      
      <div className="mt-8">
        <Link to="/donors/all">
          <Button variant="outline" className="mr-2">
            View All Donors
          </Button>
        </Link>
        <Link to="/donors/new">
          <Button>
            Add New Donor
          </Button>
        </Link>
      </div>
    </div>
  )
} 