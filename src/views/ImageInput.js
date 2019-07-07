import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { loadModels, getFullFaceDescription, createMatcher } from "../api/face";
import {
  base64StringtoFile,
  downloadBase64File
  // extractImageFileExtensionFromBase64,
  // image64toCanvasRef
} from "../learn/ResuableUtils";

// Import image to test API
const testImg = require("../img/1.jpg");

// Import face profile
const JSON_PROFILE = require("../descriptors/bnk48.json");

// Initial State
const INIT_STATE = {
  imageURL: testImg,
  fullDesc: null,
  detections: null,
  descriptors: null,
  match: null
};

class ImageInput extends Component {
  constructor(props) {
    super(props);
    this.imagePreviewCanvasRef = React.createRef();
    this.fileInputRef = React.createRef();
    this.state = {
      ...INIT_STATE,
      faceMatcher: null,
      crop: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      }
    };
  }

  componentWillMount = async () => {
    await loadModels();
    this.setState({ faceMatcher: await createMatcher(JSON_PROFILE) });
    await this.handleImage(this.state.imageURL);
  };

  handleImage = async (image = this.state.imageURL) => {
    await getFullFaceDescription(image).then(fullDesc => {
      if (!!fullDesc) {
        this.setState({
          fullDesc,
          detections: fullDesc.map(fd => fd.detection),
          descriptors: fullDesc.map(fd => fd.descriptor)
        });
      }
    });

    if (!!this.state.descriptors && !!this.state.faceMatcher) {
      let match = await this.state.descriptors.map(descriptor =>
        this.state.faceMatcher.findBestMatch(descriptor)
      );
      this.setState({ match });
    }
  };

  handleFileChange = async event => {
    this.resetState();
    await this.setState({
      imageURL: URL.createObjectURL(event.target.files[0]),
      loading: true
    });
    this.handleImage();
  };

  resetState = () => {
    this.setState({ ...INIT_STATE });
  };

  handleDownloadClick = event => {
    event.preventDefault();
    const { imageURL } = this.state;
    if (imageURL) {
      const canvasRef = this.imagePreviewCanvasRef.current;

      //const { imgSrcExt } = this.state;
      const imageData64 = canvasRef.toDataURL("image/" + "jpg");

      const myFilename = "previewFile." + "jpg";

      // file to be uploaded
      const myNewCroppedFile = base64StringtoFile(imageData64, myFilename);
      console.log(myNewCroppedFile);
      // download file
      downloadBase64File(imageData64, myFilename);
      //this.handleClearToDefault();
    }
  };

  render() {
    const { imageURL, detections, match } = this.state;

    let drawBox = null;
    if (!!detections) {
      //detection이 true 이면
      drawBox = detections.map((detection, i) => {
        let _H = detection.box.height;
        let _W = detection.box.width;
        let _X = detection.box._x;
        let _Y = detection.box._y;

        /** handleOnCropComplete */
        const canvasRef = this.imagePreviewCanvasRef.current;
        const { imageURL } = this.state;

        const canvas = canvasRef; //document.createElement('canvas');
        canvas.width = _W;
        canvas.height = _H;
        const ctx = canvas.getContext("2d");
        const image = new Image();
        image.src = imageURL;
        image.onload = function() {
          ctx.drawImage(image, _X, _Y, _W, _H, 0, 0, _W, _H);
        };

        return (
          <div key={i}>
            <div
              style={{
                position: "absolute",
                border: "solid",
                borderColor: "blue",
                height: _H,
                width: _W,
                transform: `translate(${_X}px,${_Y}px)`
              }}
            >
              {!!match ? (
                <p
                  style={{
                    backgroundColor: "blue",
                    border: "solid",
                    borderColor: "blue",
                    width: _W,
                    marginTop: 0,
                    color: "#fff",
                    transform: `translate(-3px,${_H}px)`
                  }}
                >
                  {/* {match[i]._label} */}
                </p>
              ) : null}
            </div>
          </div>
        );
      });
    }

    return (
      <div>
        <input
          ref={this.fileInputRef}
          id="myFileUpload"
          type="file"
          onChange={this.handleFileChange}
          accept=".jpg, .jpeg, .png"
        />
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute" }}>
            <img src={imageURL} alt="imageURL" />
          </div>
          {!!drawBox ? drawBox : null}
        </div>

        <p>Preview Canvas Crop </p>
        <canvas ref={this.imagePreviewCanvasRef} />
        <button onClick={this.handleDownloadClick}>Download</button>
      </div>
    );
  }
}

export default withRouter(ImageInput);
