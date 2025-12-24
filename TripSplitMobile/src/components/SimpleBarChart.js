import React from 'react';
import { View, Text } from 'react-native';

const SimpleBarChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={{marginVertical:10}}>
            {data.map((item, index) => {
                if(item.value === 0) return null;
                const widthPct = (item.value / maxVal) * 100;
                return (
                    <View key={index} style={{marginBottom:15}}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:5}}>
                            <Text style={{fontSize:14, fontWeight:'600', color:'#555'}}>{item.label}</Text>
                            <Text style={{fontSize:14, fontWeight:'bold', color:'#333'}}>₹{item.value.toFixed(0)}</Text>
                        </View>
                        <View style={{height:14, backgroundColor:'#e0e0e0', borderRadius:7, width:'100%'}}>
                            <View style={{height:14, backgroundColor: item.color || '#0288d1', borderRadius:7, width: `${widthPct}%`}} />
                        </View>
                    </View>
                )
            })}
        </View>
    )
};
export default SimpleBarChart;