import { DataSourcePlugin } from '@grafana/data';
import { EnelyzerDataSource } from './datasource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { EnelyzerQuery, EnelyzerDataSourceOptions } from './types';

export const plugin = new DataSourcePlugin<EnelyzerDataSource, EnelyzerQuery, EnelyzerDataSourceOptions>(
  EnelyzerDataSource
)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
