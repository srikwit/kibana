/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { AlertServices } from '../../../../../../../plugins/alerting/server';
import { assertUnreachable } from '../../../utils/build_query';
import {
  Filter,
  Query,
  esQuery,
  esFilters,
  IIndexPattern,
} from '../../../../../../../../src/plugins/data/server';
import { PartialFilter, RuleAlertParams } from '../types';
import { BadRequestError } from '../errors/bad_request_error';

export const getQueryFilter = (
  query: string,
  language: string,
  filters: PartialFilter[],
  index: string[]
) => {
  const indexPattern = {
    fields: [],
    title: index.join(),
  } as IIndexPattern;

  const queries: Query[] = [{ query, language }];
  const config = {
    allowLeadingWildcards: true,
    queryStringOptions: { analyze_wildcard: true },
    ignoreFilterIfFieldNotInIndex: false,
    dateFormatTZ: 'Zulu',
  };

  const enabledFilters = ((filters as unknown) as Filter[]).filter(
    f => f && !esFilters.isFilterDisabled(f)
  );

  return esQuery.buildEsQuery(indexPattern, queries, enabledFilters, config);
};

interface GetFilterArgs {
  type: RuleAlertParams['type'];
  filters: PartialFilter[] | undefined | null;
  language: string | undefined | null;
  query: string | undefined | null;
  savedId: string | undefined | null;
  services: AlertServices;
  index: string[] | undefined | null;
}

interface QueryAttributes {
  // NOTE: doesn't match Query interface
  query: {
    query: string;
    language: string;
  };
  filters: PartialFilter[];
}

export const getFilter = async ({
  filters,
  index,
  language,
  savedId,
  services,
  type,
  query,
}: GetFilterArgs): Promise<unknown> => {
  switch (type) {
    case 'query': {
      if (query != null && language != null && index != null) {
        return getQueryFilter(query, language, filters || [], index);
      } else {
        throw new BadRequestError('query, filters, and index parameter should be defined');
      }
    }
    case 'saved_query': {
      if (savedId != null && index != null) {
        try {
          // try to get the saved object first
          const savedObject = await services.savedObjectsClient.get<QueryAttributes>(
            'query',
            savedId
          );
          return getQueryFilter(
            savedObject.attributes.query.query,
            savedObject.attributes.query.language,
            savedObject.attributes.filters,
            index
          );
        } catch (err) {
          // saved object does not exist, so try and fall back if the user pushed
          // any additional language, query, filters, etc...
          if (query != null && language != null && index != null) {
            return getQueryFilter(query, language, filters || [], index);
          } else {
            // user did not give any additional fall back mechanism for generating a rule
            // rethrow error for activity monitoring
            throw err;
          }
        }
      } else {
        throw new BadRequestError('savedId parameter should be defined');
      }
    }
  }
  return assertUnreachable(type);
};
