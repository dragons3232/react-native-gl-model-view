import React, { Component } from 'react';
import { StyleSheet, Animated } from 'react-native';
import axios from 'axios';
import * as RNFS from 'react-native-fs';

import ModelView from 'react-native-gl-model-view';
const AnimatedModelView = Animated.createAnimatedComponent(ModelView);

export default class GestureControl extends Component {
  constructor() {
    super();
    this.state = {
      rotateX: new Animated.Value(-90),
      rotateZ: new Animated.Value(0),

      fromXY: undefined,
      valueXY: undefined,
    };
  }

  onMoveEnd = () => {
    this.setState({
      fromXY: undefined,
    });
  };

  onMove = e => {
    let {pageX, pageY} = e.nativeEvent,
      {rotateX, rotateZ, fromXY, valueXY} = this.state;
    if (!this.state.fromXY) {
      this.setState({
        fromXY: [pageX, pageY],
        valueXY: [rotateZ.__getValue(), rotateX.__getValue()],
      });
    } else {
      rotateZ.setValue(valueXY[0] + (pageX - fromXY[0]) / 2);
      rotateX.setValue(valueXY[1] + (pageY - fromXY[1]) / 2);
    }
  };

  getContentFromUrl(url, decode = true) {
    return axios({
      method: 'get',
      url,
      responseType: 'blob',
    }).then(
      res => {
        return new Promise((resolve, reject) => {
          const fileReader = new FileReader();
          fileReader.onloadend = () => {
            const fileName = url.split('/').reverse()[0];
            const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

            if (!decode) {
              return resolve(fileReader.result);
            }
            const data = fileReader.result.replace(/data:[^,]+base64,/, '')
            RNFS.writeFile(filePath, data, 'base64');
            resolve(`file:/${filePath}`);
          }
          fileReader.onerror = reject;
          fileReader.readAsDataURL(res.data);
        })
      }
    );
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    Promise.all([
      this.getContentFromUrl('http://localhost:3001/3DModel_LowPoly.obj', false),
      this.getContentFromUrl('http://localhost:3001/3DModel_LowPoly.mtl'),
      this.getContentFromUrl('http://localhost:3001/3DModel_LowPoly.jpg', false)
    ]).then(values => {
      this.setState({ model: values[0].replace(/data:[^,]+base64,/, 'data:geometry/obj;base64,'), texture: values[1], image: values[2] })
    }).catch(error => console.warn(error))
  }

  render() {
    let { rotateZ, rotateX, fromXY, model, texture, image } = this.state;

    return (
      <AnimatedModelView
        model={{
          uri: model,
        }}
        texture={{
          uri: image || texture,
        }}
        onStartShouldSetResponder={() => true}
        onResponderRelease={this.onMoveEnd}
        onResponderMove={this.onMove}
        animate={!!fromXY}
        tint={{ r: 1.0, g: 1.0, b: 1.0, a: 1.0 }}
        scale={1}
        rotateX={rotateX}
        rotateZ={rotateZ}
        translateZ={0}
        style={styles.container}
      />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
