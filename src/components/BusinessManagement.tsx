import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessGeneralSettings } from "./business/BusinessGeneralSettings";
import { BusinessHours } from "./business/BusinessHours";
import { BusinessPhotos } from "./business/BusinessPhotos";
import { BusinessTeam } from "./business/BusinessTeam";
import { BusinessServices } from "./business/BusinessServices";
import { BusinessCustomers } from "./business/BusinessCustomers";
import { BusinessRestrictedList } from "./business/BusinessRestrictedList";

import { BusinessSales } from "./business/BusinessSales";

export const BusinessManagement = () => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-max min-w-full md:w-full justify-start gap-1">
            <TabsTrigger value="general" className="text-xs md:text-sm whitespace-nowrap">General</TabsTrigger>
            <TabsTrigger value="hours" className="text-xs md:text-sm whitespace-nowrap">Hours</TabsTrigger>
            <TabsTrigger value="photos" className="text-xs md:text-sm whitespace-nowrap">Photos</TabsTrigger>
            <TabsTrigger value="team" className="text-xs md:text-sm whitespace-nowrap">Team</TabsTrigger>
            <TabsTrigger value="services" className="text-xs md:text-sm whitespace-nowrap">Services</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs md:text-sm whitespace-nowrap">Customers</TabsTrigger>
            <TabsTrigger value="restricted" className="text-xs md:text-sm whitespace-nowrap">Restricted</TabsTrigger>
            
            <TabsTrigger value="sales" className="text-xs md:text-sm whitespace-nowrap">Sales</TabsTrigger>
          </TabsList>
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <TabsContent value="general" className="m-0">
              <BusinessGeneralSettings />
            </TabsContent>

            <TabsContent value="hours" className="m-0">
              <BusinessHours />
            </TabsContent>

            <TabsContent value="photos" className="m-0">
              <BusinessPhotos />
            </TabsContent>

            <TabsContent value="team" className="m-0">
              <BusinessTeam />
            </TabsContent>

            <TabsContent value="services" className="m-0">
              <BusinessServices />
            </TabsContent>

            <TabsContent value="customers" className="m-0">
              <BusinessCustomers />
            </TabsContent>

            <TabsContent value="restricted" className="m-0">
              <BusinessRestrictedList />
            </TabsContent>


            <TabsContent value="sales" className="m-0">
              <BusinessSales />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};