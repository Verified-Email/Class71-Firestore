import React from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import {BarCodeScanner} from 'expo-barcode-scanner';
import * as firebase from 'firebase'
import db from '../config.js'

export default class TransactionScreen extends React.Component {
  constructor(){
    super();
    this.state = {
      hasCameraPermissions: null,
      scanned: false,
      scannedData: '',
      buttonState: 'normal',
      scannedBookId: '',
      scannedStudentId: ''
    }
  }
  getCameraPermissions = async(id)=>{
    const {status} = await Permissions.askAsync(Permissions.CAMERA)
    this.setState({
      //status === "granted" is true whenever user grants permission
      //status === "granted" is false whenever user doesn't grant permission
      hasCameraPermissions: status === "granted",
      buttonState: id,
      scanned: false
    })
  }
  handleBarCodeScanned = async({type,data}) =>  {
    const {buttonState} = this.state
    if (buttonState === "BookID") {
      this.setState({
        scanned: true,
        scannedData: data,
        buttonState: 'normal'
      });
    }
    else if (buttonState === "StudentID") {
      this.setState({
        scanned: true,
        scannedData: data,
        buttonState: 'normal'
      });
    }
    
  }
  initiateBookIssue = async()=>{
    db.collection("transactions").add({
      'studentID': this.state.scannedStudentId,
      'bookID': this.state.scannedBookId,
      'transactionDate': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "issue"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability': false
    })
    db.collection("students").doc(this.scannedStudentId).update({
      'booksIssued': firebase.firestore.FieldValue.increment(1)
    })
    Alert.alert("Book Issued")
    this.setState({
      scannedBookId: '',
      scannedStudentId: ''
    })
  }

  initiateBookReturn = async()=>{
    db.collection("transactions").add({
      'studentID': this.state.scannedStudentId,
      'bookID': this.state.scannedBookId,
      'transactionDate': firebase.firestore.Timestamp.now().toDate(),
      'transactionType': "return"
    })
    db.collection("books").doc(this.state.scannedBookId).update({
      'bookAvailability': true
    })
    db.collection("students").doc(this.scannedStudentId).update({
      'booksIssued': firebase.firestore.FieldValue.increment(-1)
    })
    Alert.alert("Book Returned")
    this.setState({
      scannedBookId: '',
      scannedStudentId: ''
    })
  }

  handleTransaction = async()=>{
    var transactionMessage
    db.collection("books").doc(this.state.scannedBookId).get()
    .then((doc)=>{
      var book = doc.data()
      if (book.bookAvailability){
        this.initiateBookIssue()
        transactionMessage = "Book Issued"
      }
      else {
        this.initiateBookReturn()
        transactionMessage = "Book Returned"
      }
    })
    this.setState({
      transactionMessage: transactionMessage
    })
  }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions

      const scanned = this.state.scanned
      const buttonState = this.state.buttonState

      if(buttonState !== "normal" && hasCameraPermissions) {
        return(
          <BarCodeScanner onBarCodeScanned = {scanned ? undefined: this.handleBarCodeScanned} style={StyleSheet.absoluteFillObject}/>
        );
      }
      else if(buttonState === "normal") {
        return(
          <View style={styles.container}>
            <View>
              <Image source={require("../assets/booklogo.jpg")}
               style={{width:200, height:200}}/>
              <Text style={{textAlign:'center', fontSize:30}}>
                Wireless Library App
              </Text>
            </View>
            <View style={styles.inputView}>
              <TextInput style={styles.inputBox} 
               placeholder="Book ID" value = {this.state.scannedBookId}/>
              <TouchableOpacity style={styles.scanButton} onPress={()=>{
                this.getCameraPermissions("BookID")
              }}>
                <Text styles={styles.buttonText}>
                  Scan
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
              <TextInput style={styles.inputBox} 
               placeholder="Student ID" value = {this.state.scannedStudentId}/>
              <TouchableOpacity style={styles.scanButton} onPress={()=>{
                this.getCameraPermissions("StudentID")
              }}>
                <Text styles={styles.buttonText}>
                  Scan
                </Text>
              </TouchableOpacity>
              
          </View>
          <TouchableOpacity style={styles.submitButton} onPress={async()=>{
            this.handleTransaction()
          }}>
              <Text style={styles.submitButtonText}>
                Submit
              </Text>
          </TouchableOpacity>
        </View>
      );
    }
  }}

  const styles = StyleSheet.create(
    {
      container: {
        flex: 1,
        justifyContent: 'center',
        allignItems: 'center'
      },
      displayText: {
        fontSize: 15,
        textDecorationLine: 'underline'
      },
      scanButton: {
        backgroundColor: '#1f2c3d',
        padding: 10,
        margin: 10,
      },
      buttonText: {
        fontSize: 20,
        textAlign: 'center',
        marginTop: 10,
      },
      inputView: {
        flexDirection: 'row',
        margin: 20,
      },
      inputBox: {
        width: 200,
        height: 40,
        borderWidth: 1.5,
        borderRightWidth: 0,
        fontSize: 20
      },
      scanButton: {
        backgroundColor: '#a7f537',
        width: 50,
        borderWidth: 1.5,
        borderLeftWidth: 0
      },
      submitButton: {
        backgroundColor: '#187267',
        width: 100,
        height: 50
      },
      submitButtonText: {
        padding: 10,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: "bold",
        color: 'white'
      }
    }  
  )
