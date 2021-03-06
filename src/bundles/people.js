import { createSelector } from 'redux-bundler'

// just being lazy here and only fetching people once
// with no error handling. Again, in a real app you
// can create abstractions for resource bundles like this
// one and then extend them to include the particulars
// for your app.

// Main thing I'm wanting to highlight here is how
// we grab the "active" person for the person detail view
// see the `selectActivePerson` selector below

export const PeopleActions = {
  FETCH_PEOPLE_START: "FETCH_PEOPLE_START",
  FETCH_PEOPLE_SUCCESS: "FETCH_PEOPLE_SUCCESS",
  FETCH_PEOPLE_ERROR: "FETCH_PEOPLE_ERROR"
};

export default {
  name: 'people',

  getReducer: () => {
    const initialData = {
      data: null,
      loading: false
    }

    return ( state = initialData, { type, payload } ) => {
      if( type === PeopleActions.FETCH_PEOPLE_START ) {
        return Object.assign( {}, state, {
          loading: true
        } )
      }
      if( type === PeopleActions.FETCH_PEOPLE_ERROR ) {
        return Object.assign( {}, state, {
          lastError: Date.now(),
          loading: false
        } )
      }
      if( type === PeopleActions.FETCH_PEOPLE_SUCCESS ) {
        return Object.assign( {}, state, {
          loading: false,
          lastFetch: Date.now(),
          lastError: null,
          // we'll just extract an ID here and insert it as a property
          // on the data for this person.
          // Normally API will include an id attribute of some kind
          // for each object in the results, but not so for this API.
          data: payload.results.map( person => {
            const split = person.url.split( '/' )
            const id = split[ split.length - 2 ]
            return Object.assign( person, { id } )
          } )
        } )
      }

      return state
    }
  },

  doFetchPeople: () => ( { dispatch, swapiFetch } ) => {
    dispatch( { type: PeopleActions.FETCH_PEOPLE_START } )
    swapiFetch( '/people' )
      .then( payload => {
        dispatch( { type: PeopleActions.FETCH_PEOPLE_SUCCESS, payload } )
      } )
      .catch( error => {
        dispatch( { type: PeopleActions.FETCH_PEOPLE_ERROR, error } )
      } )
  },

  peopleBundle_selectPeopleRaw: state => state.people,

  selectPeopleRaw: state => state.people,

  selectPeopleData: state => state.people.data,

  selectActivePerson: createSelector(
    'selectRouteParams',
    'selectPathname',
    'selectPeopleData',
    ( routeParams, pathname, peopleData ) => {
      if( !pathname.includes( '/people' ) || !routeParams.id || !peopleData ) {
        return null
      }
      return peopleData.find( person => person.id === routeParams.id ) || null
    }
  ),

  reactShouldFetchPeople: createSelector( 'selectPeopleRaw', peopleData => {
    if( peopleData.loading || peopleData.data ) {
      return false
    }
    return { actionCreator: 'doFetchPeople' }
  } ),

  // we'll extract a status string here, for display, just to show
  // the type of information available about the data
  selectPeopleDataStatus: createSelector(
    'selectPeopleRaw',
    peopleData => {
      const { data, lastError, lastFetch, loading } = peopleData

      let result = ''

      if( data ) {
        result += 'Has data'
      } else {
        result += 'Does not have data'
      }

      if( loading ) {
        return result + ' and is fetching currently'
      }

      if( lastError ) {
        return result + ` but had an error at ${ new Date( lastError ).toLocaleString() }`
      }

      if( lastFetch ) {
        return result + ` that was fetched at ${ new Date( lastFetch ).toLocaleString() }`
      }
    }
  ),
}
