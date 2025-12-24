import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet, Dimensions } from 'react-native';
const { height } = Dimensions.get('window');

export default function StaticPage({ type }) {
    const openEmail = () => Linking.openURL('mailto:sayanmondal13072002@gmail.com');
    const openLinkedIn = () => Linking.openURL('https://www.linkedin.com/in/sayan2713-mondal/');

    const content = {
        about: (
            <Text style={styles.text}>
TripSplit is a smart expense-splitting application designed to help friends, families, and groups manage shared expenses during trips, events, or daily activities.{'\n\n'}
Managing group expenses can be confusing and time-consuming. TripSplit simplifies this process by tracking who paid, who owes whom, and how much—automatically.{'\n\n'}
Key Features{'\n'}
• Create and manage multiple trips{'\n'}
• Add participants easily{'\n'}
• Log expenses with flexible splitting{'\n'}
• Automatic settlement calculation{'\n'}
• Graphical insights with subscriptions{'\n'}
• Secure authentication and data storage{'\n\n'}
Our goal is to make group expense management transparent, fair, and stress-free—so you can focus on enjoying the trip, not the math.{'\n\n'}
TripSplit. All rights reserved.
            </Text>
        ),
        contact: (
            <View>
                <Text style={styles.text}>
We’d love to hear from you. If you have any questions, feedback, feature requests, or issues, feel free to reach out.{'\n'}
                </Text>
                <View style={{marginVertical:10}}>
                    <Text style={styles.label}>Support Email</Text>
                    <TouchableOpacity onPress={openEmail}><Text style={styles.link}>sayanmondal13072002@gmail.com</Text></TouchableOpacity>
                </View>
                <View style={{marginVertical:10}}>
                    <Text style={styles.label}>LinkedIn</Text>
                    <TouchableOpacity onPress={openLinkedIn}><Text style={styles.link}>View Profile</Text></TouchableOpacity>
                </View>
                <Text style={[styles.text, {marginTop:10}]}>
Response Time{'\n'}
We usually respond within 24–48 hours on business days.{'\n\n'}
TripSplit. All rights reserved.
                </Text>
            </View>
        ),
        howto: (
            <Text style={styles.text}>
1. Create a Trip{'\n'}
After logging in, create a new trip by entering a trip name. Each trip represents a journey or event where expenses will be tracked.{'\n\n'}
2. Add Participants{'\n'}
Add all people who are part of the trip. Participants can be added manually or invited via email.{'\n\n'}
3. Add Expenses{'\n'}
Record expenses by entering the title, amount, category, payer, and selecting who shared the expense.{'\n\n'}
4. Automatic Settlement{'\n'}
TripSplit automatically calculates who owes whom and how much, based on all recorded expenses.{'\n\n'}
5. View Expense Log{'\n'}
Review all expenses in the expense log. You can edit or delete expenses if needed.{'\n\n'}
6. Analyze with Graphs{'\n'}
Use the Graph section to visualize spending by category, timeline, and individuals (based on your subscription plan).{'\n\n'}
7. Manage Your Profile{'\n'}
Update your profile details, change your password, or manage your subscription from the profile section.{'\n\n'}
8. Upgrade for More Features{'\n'}
Unlock advanced analytics and premium features by upgrading your subscription plan.{'\n\n'}
TripSplit helps you focus on the trip — not the math.
            </Text>
        ),
        terms: (
            <Text style={styles.text}>
By using the TripSplit application, you agree to the following terms and conditions. Please read them carefully.{'\n\n'}
1. Usage{'\n'}
TripSplit is designed to help users manage and split expenses. You agree to use the app only for lawful purposes.{'\n\n'}
2. User Responsibility{'\n'}
You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.{'\n\n'}
3. Data Accuracy{'\n'}
TripSplit does not guarantee the accuracy of calculations if incorrect data is entered by the user. Please verify expense details carefully.{'\n\n'}
4. Subscription & Payments{'\n'}
Certain features are available only under paid subscription plans. Subscription fees are non-refundable unless required by law.{'\n\n'}
5. Account Termination{'\n'}
We reserve the right to suspend or terminate accounts that violate these terms or misuse the service.{'\n\n'}
6. Limitation of Liability{'\n'}
TripSplit shall not be liable for any indirect, incidental, or consequential damages arising from the use of the app.{'\n\n'}
7. Changes to Terms{'\n'}
These terms may be updated from time to time. Continued use of the app constitutes acceptance of the updated terms.{'\n\n'}
Last updated: 2025
            </Text>
        ),
        copyright: (
            <Text style={styles.text}>
All content, features, source code, designs, logos, icons, graphics, text, and software used in the TripSplit application are the exclusive property of TripSplit and are protected under applicable copyright laws.{'\n\n'}
Unauthorized copying, modification, distribution, transmission, performance, display, or other use of this application or any of its content without prior written permission is strictly prohibited.{'\n\n'}
This application is provided for personal and non-commercial use only. Any commercial use, resale, or redistribution is not permitted without explicit authorization.{'\n\n'}
For copyright-related inquiries, please contact our support team.{'\n\n'}
TripSplit — Smart expense sharing for trips.
            </Text>
        )
    };

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.card, {minHeight: height * 0.7}]}>
                <Text style={styles.title}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                {content[type]}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { padding: 15 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, elevation: 2 },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
    text: { lineHeight: 22, fontSize: 14, color: '#444' },
    label: { fontWeight: 'bold', color: '#555' },
    link: { color: '#0288d1', fontSize: 16 }
});