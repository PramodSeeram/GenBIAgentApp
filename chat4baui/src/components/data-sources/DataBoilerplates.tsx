
import React from 'react';
import { Link } from 'react-router-dom';
import DataSourceCard from './DataSourceCard';
import { 
  HubSpotIcon, 
  GoogleAnalyticsIcon, 
  WooCommerceIcon, 
  StripeIcon, 
  FacebookMarketingIcon 
} from './icons/DataSourceIcons';

const DataBoilerplates = () => {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-medium mb-2">Start with a data boilerplate</h2>
      <p className="text-muted-foreground mb-4">
        At Chat4BA, we offer boilerplates with clearly defined semantics. Choose one to quickly start gaining insights by asking questions.
      </p>
      <p className="mb-4">
        <Link to="#" className="text-primary hover:underline">Learn more about data boilerplates.</Link>
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataSourceCard to="/modeling">
          <HubSpotIcon className="mr-2 h-5 w-5" />
          <span>HubSpot</span>
        </DataSourceCard>
        
        <DataSourceCard to="/modeling">
          <GoogleAnalyticsIcon className="mr-2 h-5 w-5" />
          <span>Google Analytics 4</span>
        </DataSourceCard>
        
        <DataSourceCard to="/modeling" badge="Beta">
          <WooCommerceIcon className="mr-2 h-5 w-5" />
          <span>WooCommerce</span>
        </DataSourceCard>
        
        <DataSourceCard to="/modeling" badge="Beta">
          <StripeIcon className="mr-2 h-5 w-5" />
          <span>Stripe</span>
        </DataSourceCard>
        
        <DataSourceCard to="/modeling" badge="Beta">
          <FacebookMarketingIcon className="mr-2 h-5 w-5" />
          <span>Facebook Marketing</span>
        </DataSourceCard>
      </div>
    </section>
  );
};

export default DataBoilerplates;
