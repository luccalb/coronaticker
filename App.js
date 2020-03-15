import React, {Component} from 'react';
import {Image, ListItem, SearchBar} from 'react-native-elements';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

export default class Home extends Component {
  render() {
    return (
      <View style={{flexDirection: 'column', flex: 1}}>
        <SearchComponent onSearch={this.filterSearch} />
        <CountryList ref="countryList" />
      </View>
    );
  }

  filterSearch = searchString => {
    //console.log('recieved search ' + searchString.toString());
    this.refs.countryList.applySearchFilter(searchString);
  };
}

class SearchComponent extends Component {
  state = {
    search: '',
  };

  updateSearch = search => {
    this.setState({search});
    this.props.onSearch(search);
  };

  render() {
    const {search} = this.state;

    return (
      <View style={{flex: 0}}>
        <SearchBar
          placeholder="Search your country"
          onChangeText={text => this.updateSearch(text)}
          onClear={text => this.updateSearch('')}
          value={search}
          lightTheme={true}
          round={true}
        />
      </View>
    );
  }
}

class TotalNumbersFlex extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoadingDeaths: true,
      isLoadingCases: true,
      isLoadingRecovered: true,
    };
    this.getData();
  }

  apiService = new ApiService();

  reload = () => {
    this.setState({
      dataSourceDeaths: null,
      dataSourceConfirmed: null,
      dataSourceRecovered: null,
    });
    this.getData();
  };

  getData = () => {
    return this.apiService
      .getTotalDeaths()
      .then(responseDeathsJson => {
        this.setState(
          {
            dataSourceDeaths: responseDeathsJson.features[0].attributes.value,
            isLoadingDeaths: false,
          },
          function() {},
        );
        this.apiService.getTotalCases().then(responseConfirmedJson => {
          this.setState(
            {
              dataSourceConfirmed:
                responseConfirmedJson.features[0].attributes.value,
              isLoadingCases: false,
            },
            function() {},
          );
          this.apiService.getTotalRecovered().then(responseRecoveredJson => {
            this.setState(
              {
                dataSourceRecovered:
                  responseRecoveredJson.features[0].attributes.value,
                isLoadingRecovered: false,
              },
              function() {},
            );
          });
        });
      })
      .catch(error => {
        console.error(error);
      });
  };

  render() {
    if (
      this.state.isLoadingCases ||
      this.state.isLoadingDeaths ||
      this.state.isLoadingRecovered
    ) {
      return (
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={{flex: 0, flexDirection: 'row'}}>
        <View
          style={{
            flex: 1,
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>Confirmed</Text>
          <Text>{this.state.dataSourceConfirmed}</Text>
        </View>
        <View
          style={{
            flex: 1,
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>Deaths</Text>
          <Text>{this.state.dataSourceDeaths}</Text>
        </View>
        <View
          style={{
            flex: 1,
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>Recovered</Text>
          <Text>{this.state.dataSourceRecovered}</Text>
        </View>
      </View>
    );
  }
}

class CountryList extends Component {
  apiService = new ApiService();

  constructor(props) {
    super(props);
    this.state = {isLoading: true, refreshing: false};
    this.arrayholder = [];
    this.getData();
  }

  applySearchFilter(filter) {
    //console.log(filter);
    //passing the inserted text in textinput
    const newData = this.arrayholder.filter(function(item) {
      //applying filter for the inserted text in search bar
      const itemData = item.attributes.Country_Region
        ? item.attributes.Country_Region.toUpperCase()
        : ''.toUpperCase();
      const textData = filter.toUpperCase();
      return itemData.indexOf(textData) > -1;
    });
    this.setState({
      //setting the filtered newData on datasource
      //After setting the data it will automatically re-render the view
      dataSource: newData,
    });
  }

  onRefresh() {
    this.setState({refreshing: true, dataSource: []});
    this.refs.totalNumbers.reload();
    this.apiService.getCountryList().then(responseJson => {
      this.setState(
        {
          refreshing: false,
          dataSource: responseJson.features,
        },
        function() {},
      );
      this.arrayholder = this.state.dataSource;
    });
  }

  getData = () => {
    return this.apiService
      .getCountryList()
      .then(responseJson => {
        this.setState(
          {
            isLoading: false,
            dataSource: responseJson.features,
          },
          function() {},
        );
        this.arrayholder = this.state.dataSource;
      })
      .catch(error => {
        console.error(error);
      });
  };

  render() {
    if (this.state.isLoading) {
      return (
        <View style={{flex: 1, padding: 20}}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <ScrollView
        style={{flex: 1}}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.onRefresh.bind(this)}
          />
        }>
        <TotalNumbersFlex ref="totalNumbers" />
        {this.state.dataSource.map((item, i) => (
          <ListItem
            contentContainerStyle={{padding: 20}}
            subtitle={
              <Text>
                <Text style={styles.grey}>C </Text>
                <Text>{item.attributes.Confirmed}</Text>
                <Text style={styles.red}> D </Text>
                <Text>{item.attributes.Deaths}</Text>
                <Text style={styles.blue}> R </Text>
                <Text>{item.attributes.Recovered}</Text>
              </Text>
            }
            leftElement={
              <Image
                source={{
                  uri:
                    'https://cdn.countryflags.com/thumbs/germany/flag-square-250.png',
                }}
                style={{width: 75, height: 75}}
                containerStyle={{borderRadius: 10, overflow: 'hidden'}}
              />
            }
            key={i}
            title={item.attributes.Country_Region}
          />
        ))}
      </ScrollView>
    );
  }
}

class ApiService {
  constructor() {}

  getCountryList() {
    return fetch(
      'https://services9.arcgis.com/N9p5hsImWXAccRNI/arcgis/rest/services/Z7biAeD8PAkqgmWhxG2A/FeatureServer/2/query?f=json&where=Confirmed%20%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Confirmed%20desc&resultOffset=0&resultRecordCount=200&cacheHint=true',
    ).then(response => response.json());
  }

  getTotalDeaths() {
    return fetch(
      'https://services9.arcgis.com/N9p5hsImWXAccRNI/arcgis/rest/services/Z7biAeD8PAkqgmWhxG2A/FeatureServer/1/query?f=json&where=Confirmed%20%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=[{"statisticType":"sum","onStatisticField":"Deaths","outStatisticFieldName":"value"}]&cacheHint=true',
    ).then(responseDeaths => responseDeaths.json());
  }

  getTotalCases() {
    return fetch(
      'https://services9.arcgis.com/N9p5hsImWXAccRNI/arcgis/rest/services/Z7biAeD8PAkqgmWhxG2A/FeatureServer/1/query?f=json&where=Confirmed%20%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=[{"statisticType":"sum","onStatisticField":"Confirmed","outStatisticFieldName":"value"}]&cacheHint=true',
    ).then(responseConfirmed => responseConfirmed.json());
  }

  getTotalRecovered() {
    return fetch(
      'https://services9.arcgis.com/N9p5hsImWXAccRNI/arcgis/rest/services/Z7biAeD8PAkqgmWhxG2A/FeatureServer/1/query?f=json&where=Confirmed%20%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&outStatistics=[{"statisticType":"sum","onStatisticField":"Recovered","outStatisticFieldName":"value"}]&cacheHint=true',
    ).then(responseRecovered => responseRecovered.json());
  }
}

const styles = StyleSheet.create({
  blue: {
    color: 'dodgerblue',
    fontWeight: 'bold',
  },
  red: {
    color: 'red',
    fontWeight: 'bold',
  },
  grey: {
    color: 'lightgrey',
    fontWeight: 'bold',
  },
});
