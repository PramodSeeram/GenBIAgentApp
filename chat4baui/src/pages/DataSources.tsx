
import React from 'react';
import { Layout } from '@/components/layout/Layout';
import SampleDatasets from '@/components/data-sources/SampleDatasets';
import DataBoilerplates from '@/components/data-sources/DataBoilerplates';
import ExternalDataSources from '@/components/data-sources/ExternalDataSources';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const DataSources = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold">Setup your project</h1>
          <ThemeToggle />
        </div>
        
        <SampleDatasets />
        <DataBoilerplates />
        <ExternalDataSources />
      </div>
    </Layout>
  );
};

export default DataSources;
